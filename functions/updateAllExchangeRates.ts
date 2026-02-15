import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('EXCHANGERATE_API_KEY');
    const today = new Date().toISOString().split('T')[0];
    
    // Common currency pairs to update
    const pairs = [
      { from: 'USD', to: 'ILS' },
      { from: 'ILS', to: 'USD' },
      { from: 'USD', to: 'EUR' },
      { from: 'EUR', to: 'USD' },
      { from: 'USD', to: 'GBP' },
      { from: 'GBP', to: 'USD' },
    ];
    
    const results = [];
    
    for (const pair of pairs) {
      try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${pair.from}/${pair.to}`);
        const data = await response.json();
        
        if (data.result === 'success') {
          await base44.entities.FXRate.create({
            date: today,
            from_currency: pair.from,
            to_currency: pair.to,
            rate: data.conversion_rate,
            source: 'exchangerate-api'
          });
          
          results.push({ ...pair, rate: data.conversion_rate, success: true });
        } else {
          results.push({ ...pair, success: false, error: 'API error' });
        }
        
        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.push({ ...pair, success: false, error: error.message });
      }
    }

    return Response.json({ 
      total: pairs.length,
      updated: results.filter(r => r.success).length,
      results,
      date: today
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});