import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { symbol, holding_id } = await req.json();
    const holdingId = holding_id;
    
    if (!symbol) {
      return Response.json({ error: 'Symbol required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('FINNHUB_API_KEY');
    
    // Fetch current price from Finnhub
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
    const data = await response.json();
    
    if (data.error || !data.c) {
      return Response.json({ error: 'Failed to fetch price', details: data }, { status: 400 });
    }

    const currentPrice = data.c; // Current price
    
    // Update holding if holdingId provided
    if (holdingId) {
      const holding = await base44.entities.Holding.get(holdingId);
      const marketValue = holding.quantity * currentPrice;
      const unrealizedPL = (currentPrice - holding.avg_cost) * holding.quantity;
      const unrealizedPLPct = holding.avg_cost > 0 ? ((currentPrice - holding.avg_cost) / holding.avg_cost * 100) : 0;
      
      await base44.entities.Holding.update(holdingId, {
        current_price: currentPrice,
        market_value: marketValue,
        unrealized_pl: unrealizedPL,
        unrealized_pl_pct: unrealizedPLPct,
        last_updated: new Date().toISOString().split('T')[0],
      });
    }

    return Response.json({ 
      symbol, 
      price: currentPrice,
      updated: true 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});