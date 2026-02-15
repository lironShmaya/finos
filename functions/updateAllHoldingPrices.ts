import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('FINNHUB_API_KEY');
    const holdings = await base44.entities.Holding.list();
    
    const results = [];
    
    for (const holding of holdings) {
      try {
        // Fetch price from Finnhub
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${holding.symbol}&token=${apiKey}`);
        const data = await response.json();
        
        if (data.c) {
          const currentPrice = data.c;
          const marketValue = holding.quantity * currentPrice;
          const unrealizedPL = (currentPrice - holding.avg_cost) * holding.quantity;
          const unrealizedPLPct = holding.avg_cost > 0 ? ((currentPrice - holding.avg_cost) / holding.avg_cost * 100) : 0;
          
          await base44.entities.Holding.update(holding.id, {
            current_price: currentPrice,
            market_value: marketValue,
            unrealized_pl: unrealizedPL,
            unrealized_pl_pct: unrealizedPLPct,
            last_updated: new Date().toISOString().split('T')[0],
          });
          
          results.push({ symbol: holding.symbol, price: currentPrice, success: true });
        } else {
          results.push({ symbol: holding.symbol, success: false, error: 'No price data' });
        }
        
        // Rate limit: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.push({ symbol: holding.symbol, success: false, error: error.message });
      }
    }

    return Response.json({ 
      total: holdings.length,
      updated: results.filter(r => r.success).length,
      results 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});