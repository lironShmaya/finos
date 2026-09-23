import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { from, to } = await req.json();
    
    if (!from || !to) {
      return Response.json({ error: 'from and to currencies required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('EXCHANGERATE_API_KEY');
    
    // Fetch exchange rate
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}`);
    const data = await response.json();
    
    if (data.result !== 'success') {
      return Response.json({ error: 'Failed to fetch exchange rate', details: data }, { status: 400 });
    }

    const rate = data.conversion_rate;
    const today = new Date().toISOString().split('T')[0];
    
    // Save to FXRate entity
    await base44.entities.FXRate.create({
      date: today,
      from_currency: from,
      to_currency: to,
      rate: rate,
      source: 'exchangerate-api'
    });

    return Response.json({ 
      from,
      to,
      rate,
      date: today
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});