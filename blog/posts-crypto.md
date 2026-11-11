=== funding-rates-decoded | Crypto | Funding rates decoded: how to read who is paying whom
> Funding is the small fee that keeps perpetual contracts glued to the real price. Read correctly, it is one of the cleanest windows into how traders are positioned.

## What funding actually is

A perpetual contract never expires, so nothing forces its price back to the real (spot) price the way an expiry date does for a normal future. Exchanges solve this with funding: every few hours, one side of the market pays the other. When the contract trades above spot, longs pay shorts. When it trades below, shorts pay longs. The payment makes the crowded side a little more expensive to hold, which nudges price back toward spot.

Two things follow from this. First, funding is not a fee paid to the exchange; it moves between traders. Second, the rate is a direct measurement of imbalance. A high positive rate says buyers are so eager for leveraged exposure that they will pay to keep it.

## Reading the level

Most large coins sit near a small positive baseline in calm markets, because there is a structural demand for leveraged long exposure. What matters is the distance from that baseline.

- **Slightly positive, stable:** a normal market. No information.
- **Strongly positive and rising:** longs are crowded. The trend may continue, but it now depends on new buyers arriving, and every holder is paying to wait.
- **Negative:** shorts are paying. In an uptrend this is rare and often bullish, because the move is not built on leverage. In a downtrend it means shorts are crowded and a squeeze is possible.
- **Extreme in either direction:** the market is fragile. A modest move against the crowd can force liquidations that feed on themselves.

## Funding plus price: the combinations that matter

Funding alone is a weak signal. Paired with price it becomes useful.

- **Price rising, funding flat or falling:** the rally is being driven by spot buying rather than leverage. Historically the healthiest kind.
- **Price rising, funding spiking:** late leveraged buyers are chasing. Not a sell signal on its own, but risk of a sharp flush is higher.
- **Price falling, funding still high:** longs are refusing to close. This is the most dangerous pattern for bulls, because the forced selling has not happened yet.
- **Price falling, funding deeply negative:** shorts are piling in late. Sharp relief rallies often start here.

## The cost side that people forget

A funding rate quoted per interval looks tiny. Annualised, it is not. A rate of 0.03% every eight hours is roughly 33% a year. If you hold a leveraged long for weeks in a hot market, funding can quietly consume a large share of the profit. This is also why funding matters for backtests: a strategy tested on price alone will overstate returns for any position held through expensive funding.

## Using it without fooling yourself

Three habits keep funding analysis honest.

1. **Compare a coin with its own history,** not with other coins. Small or newly listed coins routinely show rates that would be extreme for Bitcoin.
2. **Watch the change, not just the level.** A rate that doubles in a day carries more information than one that has been high for a month.
3. **Never trade it alone.** Crowded positioning can stay crowded for a long time in a strong trend. Funding tells you how fragile a move is, not when it ends.

## Key takeaways

- Funding is a payment between traders that measures how one-sided positioning is.
- The most useful reading combines funding with the direction of price.
- High funding is a real cost; annualise it before holding a position for weeks.
- Extremes signal fragility, not timing.

=== open-interest-and-price | Crypto | Open interest and price: the four combinations every trader should know
> Open interest tells you whether money is entering or leaving a market. Combined with price direction it separates strong moves from hollow ones.

## Open interest is not volume

Volume counts how much traded. Open interest counts how many contracts are still open at the end of it. If two traders open a new position with each other, open interest rises. If two traders both close, it falls. If one closes while a new trader takes the other side, it does not change at all. So open interest measures commitment: how much money is currently sitting in open bets.

That makes it a natural partner for price. Price says which way the market moved. Open interest says whether that move attracted new money or was caused by existing traders leaving.

## The four combinations

**1. Price up, open interest up.** New money is entering on the long side, or new shorts are being opened into strength and losing. Either way, fresh positions are backing the move. This is the classic picture of a trend with fuel.

**2. Price up, open interest down.** The rally is being driven by shorts closing, not by new buyers. Short-covering rallies are fast and convincing, then tend to stall once the shorts are gone, because there is nobody left who is forced to buy.

**3. Price down, open interest up.** New shorts are being opened, or longs are adding on the way down. Both mean conviction on the sell side or trapped longs who have not given up. The decline has fuel.

**4. Price down, open interest down.** Longs are closing or being liquidated. This is a clean-out. When open interest has fallen a long way alongside price, most of the forced selling is done, and the market is often closer to a floor than it feels.

## Why the level matters too

A market with very high open interest relative to its recent past is heavily leveraged. That does not predict direction, but it predicts violence: there are more positions that can be forced out. After a large flush, open interest resets lower and the market is usually calmer for a while.

A useful habit is to measure open interest in two ways. Measured in coins, it removes the effect of price changing. Measured in dollars, it shows how much capital is at stake. If dollar open interest is rising only because the price went up, nothing has really changed.

## Common mistakes

- **Reading every rise as bullish.** Open interest has no direction. Every contract has a long and a short. You need price, funding or the long/short ratio to infer who is the aggressor.
- **Ignoring listings and expiries.** A new contract or a migration between products can shift open interest without any change in sentiment.
- **Comparing across exchanges carelessly.** Each venue reports its own figure. A drop on one may simply be traders moving to another.

## A practical routine

Before taking a trade in the direction of a move, ask one question: is open interest confirming it? A breakout with rising open interest and moderate funding has participation behind it. A breakout with falling open interest is a squeeze, and squeezes are for taking profit into, not for chasing.

After a sharp drop, look at how much open interest left. If price fell 10% and open interest fell 25%, leverage has been cleared. If price fell 10% and open interest barely moved, the trapped positions are still there.

## Key takeaways

- Open interest measures open commitment, not activity.
- Rising price with rising open interest is participation; rising price with falling open interest is short covering.
- Large falls in open interest mark the end of forced selling more reliably than price does.
- Always pair it with another measure to know which side is in control.

=== bitcoin-halving-cycles | Crypto | Bitcoin halving cycles: what the supply schedule can and cannot tell you
> The halving is the most famous event in crypto. It is also one of the most over-interpreted. Here is a sober way to think about it.

## The mechanism

Roughly every four years, the reward that Bitcoin miners receive for each block is cut in half. This is written into the protocol and cannot be voted away easily. The effect is that the flow of new coins entering the market drops by half overnight, while the existing stock is unchanged.

Because the schedule is fixed and public, the halving is the opposite of a surprise. Everyone knows the date years ahead. That fact should make any trader cautious about simple "buy before the halving" stories: a known event is, in principle, already reflected in the price.

## Why it may still matter

There are two serious arguments that it does matter.

The first is flow. Miners have real costs in electricity and hardware, and many sell a large share of what they earn. Halving the reward halves that steady stream of selling. If demand is unchanged, less supply has to be absorbed each day. The effect is small relative to daily trading volume, but it is persistent, and persistent small flows can matter over months.

The second is narrative. Halvings arrive on a schedule, the media covers them, and new participants hear about scarcity. Attention itself moves markets, particularly in an asset with no cash flows to anchor its value.

## Why the pattern is weaker than it looks

Past cycles show strong rallies in the year or so after a halving. But there have only been a handful of halvings, which is far too few to establish anything statistically. Each one also coincided with a different global backdrop of interest rates and liquidity, and those forces may explain the returns better than the halving does.

There is also a structural reason for the effect to fade. Each halving removes a smaller absolute amount of new supply relative to the total already in existence. The first halving cut issuance dramatically as a share of supply. Later ones change it by a fraction of a percent per year. Meanwhile the holders who matter most are no longer miners but funds, companies and long-term holders whose decisions dwarf miner flow.

## What actually changes at the halving

- **Miner economics.** Revenue per block halves immediately. Inefficient miners can become unprofitable and shut down, which lowers the network's computing power until difficulty adjusts.
- **Miner selling.** In the months around the event, stressed miners may sell reserves, which can add supply rather than remove it.
- **Fee importance.** As the block reward shrinks, transaction fees become a larger part of miner income, tying security more closely to actual usage.

## How to use it in practice

Treat the halving as a slow change in background conditions, not as a signal. It is a reason to pay attention to miner behaviour and to supply held by long-term holders. It is not a reason to take a leveraged position on a calendar date.

If you want to test the idea, define it precisely before looking at the data: what you would buy, when, and when you would sell. Then note how few independent examples you have. A rule that worked three times out of three is an anecdote, not evidence.

## Key takeaways

- The halving cuts new supply but is fully known in advance.
- Its direct effect shrinks with every cycle as issuance becomes a tiny share of total supply.
- The historical pattern rests on very few examples and overlaps with global liquidity cycles.
- Watch miner health and holder behaviour; do not trade the date.

=== liquidation-cascades | Crypto | Liquidation cascades: how leverage turns a dip into a crash
> The fastest moves in crypto are rarely caused by news. They are caused by forced selling feeding on itself. Understanding the mechanics helps you avoid being the fuel.

## What a liquidation is

When you trade with leverage, you post a deposit (margin) and borrow the rest. If the price moves against you far enough that your deposit can no longer cover the loss, the exchange closes your position automatically. That forced closure is a liquidation. For a long position, it means the exchange sells at market, whatever the price.

The higher the leverage, the smaller the move needed. At 10x, a fall of roughly 10% wipes the deposit. At 50x, about 2% is enough.

## How a cascade forms

A cascade needs three ingredients: a lot of leverage on one side, liquidation prices clustered close together, and thin liquidity.

1. Price drops for an ordinary reason and reaches the first cluster of liquidation levels.
2. The exchange sells those positions at market. That selling pushes price lower.
3. The lower price reaches the next cluster. More forced selling.
4. Market makers, seeing one-sided flow, widen their quotes or step back. Liquidity thins exactly when it is most needed.
5. The process repeats until the leverage is gone or large buyers step in.

The key point is that the selling is not a decision. Nobody in the chain is judging value. That is why cascades overshoot, and why prices often recover a good part of the move within hours.

## Signs that a market is primed

- **Open interest at a high** relative to recent weeks, especially if it rose faster than price.
- **Funding strongly one-sided,** showing that the leverage is concentrated on one side.
- **A long, low-volatility grind,** which encourages traders to use more leverage and place stops close.
- **Obvious levels.** Round numbers and recent lows attract both stops and liquidation prices.

None of these tells you when. They tell you how far a move could run once it starts.

## The same thing in reverse

Short squeezes are cascades pointing up. Shorts are liquidated by forced buying, which lifts price into the next group of shorts. Squeezes tend to be even sharper than long liquidations because losses on a short are not capped by the price reaching zero.

## Protecting yourself

- **Use less leverage than the exchange allows.** The maximum is a marketing number, not advice.
- **Size from the stop, not from the leverage.** Decide how much you are willing to lose, find the distance to your stop, and let that set the position size. Leverage then becomes an output, not a choice.
- **Keep your liquidation price far beyond your stop.** If your stop and your liquidation are close, a single wick decides the outcome.
- **Avoid crowded stops.** Placing a stop just under an obvious low puts you in the first cluster.
- **Respect gaps in tokenised stocks.** Contracts that track shares can jump when the underlying market reopens, moving straight through a stop.

## Trading after a cascade

The period right after a flush is often lower risk than the period before it. Leverage has been cleared, funding has reset, and weak holders are out. That does not guarantee a bounce, and catching the exact low is luck. A more reliable approach is to wait for open interest to stop falling and for price to hold a level for several candles before considering an entry.

## Key takeaways

- Liquidations are forced, price-insensitive orders, which is why they overshoot.
- High open interest, one-sided funding and quiet markets are the setup.
- Position size should come from your stop distance, never from the leverage slider.
- The aftermath of a cascade is usually a cleaner market than the build-up.

=== crypto-basis-trade | Crypto | The basis trade: how professionals earn yield without betting on direction
> When futures trade above spot, there is a gap that can be captured with no view on price. It is the closest thing crypto has to a carry trade, and it carries its own risks.

## The idea in one paragraph

Buy the coin in the spot market and, at the same time, sell the same amount in the futures market. You now own the coin and owe the coin. If the price doubles, the spot gains and the futures loses by the same amount. If it halves, the reverse. Direction cancels out. What remains is the difference between the two prices, called the basis, plus or minus any funding payments.

## Two versions

**Dated futures.** A future that expires in three months may trade a few percent above spot. Sell it, hold spot, and at expiry the two prices must converge. The premium you sold becomes your return, known on the day you enter.

**Perpetuals.** There is no expiry, so there is no fixed premium. Instead, the short side receives funding whenever funding is positive. The return is not known in advance; it depends on how funding behaves while you hold the position.

## Why the gap exists

In a bullish market, many traders want leveraged long exposure and are willing to pay for it. Futures are the easiest way to get it, so demand pushes futures above spot. The basis trader is, in effect, lending their balance sheet to those buyers and being paid for it. That is why the basis is widest when sentiment is hottest, and can vanish or turn negative in a downturn.

## Where the risk hides

"Market neutral" does not mean "risk free."

- **Margin on the short leg.** If price rallies hard, the futures short shows a loss that must be covered with more margin, even though the spot is gaining. If the spot is held somewhere it cannot be used as collateral, you can be liquidated on a trade that is profitable overall.
- **Funding can flip.** On perpetuals, positive funding can turn negative, at which point the short pays instead of receives.
- **Exchange risk.** Both legs sit on a venue. If it fails or freezes withdrawals, the hedge is worthless.
- **Execution.** Entering and exiting two legs costs fees and spread twice. On a thin basis, costs can consume the entire return.
- **Basis can widen before it narrows.** With dated futures you are safe at expiry, but a mark-to-market loss on the way can still force you out.

## What the basis tells directional traders

Even if you never put the trade on, the basis is worth watching.

- A **wide positive basis** means leveraged demand is strong. It often accompanies the later stages of a rally.
- A **collapsing basis** during a price rise suggests leveraged buyers are stepping back, a quiet loss of momentum.
- A **negative basis** means futures trade below spot: fear, or heavy hedging. Persistent negative basis has historically appeared near periods of stress and capitulation.

## Doing the sums honestly

Before considering it, write down the annualised return after all costs: the premium or expected funding, minus trading fees on four transactions, minus any borrowing cost, minus the opportunity cost of capital tied up as margin. Then compare the result with what a plain, safe alternative would pay. The trade is only worth the operational risk when the gap between those two numbers is clearly positive.

## Key takeaways

- Long spot plus short futures removes price direction and leaves the basis.
- Dated futures give a known return at entry; perpetuals give a variable one.
- The main dangers are margin calls on the short leg and exchange failure.
- The basis itself is a useful gauge of leveraged demand.

=== stablecoin-liquidity | Crypto | Stablecoin supply: the liquidity gauge hiding in plain sight
> Most crypto buying is done with stablecoins. Watching how much of them exists, and where it sits, gives a rough picture of the buying power available.

## Why stablecoins matter

A stablecoin is a token designed to stay worth one unit of a currency, usually the US dollar. On most exchanges, coins are priced and settled in stablecoins rather than in bank money. They are the cash of the crypto economy.

That gives their supply a special meaning. New stablecoins are generally created when someone sends real money to the issuer. So growth in supply is a sign that fresh capital has arrived and is sitting inside the system, able to buy. Shrinking supply means money is leaving.

## Three ways to read it

**Total supply trend.** A steady rise over months has tended to accompany healthy markets, and sustained contraction has accompanied weak ones. The relationship is loose and slow; it is background, not a trigger.

**Supply held on exchanges.** Stablecoins sitting on trading venues are closer to being used than those in private wallets or lending protocols. A build-up on exchanges is sometimes described as "dry powder." It is potential demand, though it can sit unused for a long time.

**The ratio to market value.** Comparing stablecoin supply with the total value of other coins shows how much buying power exists relative to what there is to buy. A high ratio after a sell-off means a lot of cash relative to assets; a very low ratio late in a rally means most of the cash has already been spent.

## The cautions

- **Creation is not always new money.** Issuers sometimes mint in advance to hold inventory, and tokens are moved between blockchains, which can look like supply changes without any real flow.
- **Stablecoins are used outside trading.** Payments, savings in countries with weak currencies and lending all absorb supply. Growth from those uses says little about demand for coins.
- **Not all stablecoins are equal.** Some are backed by cash and short-term government debt. Others are backed by crypto collateral or by algorithms. The latter can lose their peg under stress, and when a large one does, the damage spreads.
- **Timing is poor.** Supply data can confirm a regime, but it rarely turns before price does.

## The peg as a stress signal

A stablecoin trading even slightly below its target is information. Small deviations happen in every sharp sell-off as people rush to exit. Persistent or widening deviations suggest doubt about backing or a rush that the issuer cannot meet quickly. During stress it is worth checking the price of the major stablecoins against each other, not just the price of coins against them.

## Putting it to work

Use stablecoin data the way a stock investor uses money-supply or fund-flow data: as context for how much weight to put on other signals.

- Rising supply plus rising prices: the advance has funding behind it.
- Rising prices with flat or falling supply: the rally is running on leverage or rotation rather than new capital, and is more vulnerable.
- Falling prices with rising exchange balances: buyers are waiting. Not a signal to buy, but a reason not to assume the worst.

## Key takeaways

- Stablecoins are the settlement cash of crypto, so their supply approximates available buying power.
- Trend, location and the ratio to market value are the three useful views.
- Minting mechanics and non-trading uses blur the picture; treat it as slow context.
- A wobbling peg is an early warning of stress.

=== altcoin-rotation-dominance | Crypto | Bitcoin dominance and altcoin rotation: where money moves and when
> Capital in crypto tends to move in a rough order, from the largest asset outward. Bitcoin's share of the total market is the simplest way to track it.

## What dominance measures

Bitcoin dominance is Bitcoin's market value divided by the value of all coins combined. If it rises, Bitcoin is outperforming the rest on average. If it falls, the rest are outperforming Bitcoin. It says nothing about whether prices overall are going up or down, only about relative performance.

That last point trips people up. Dominance can fall because smaller coins are soaring, or because Bitcoin is falling faster than they are. You always need the direction of the overall market alongside it.

## The rotation story

The usual description of a full cycle goes like this.

1. **Bitcoin leads.** After a bear market, the first money to return goes to the largest, most liquid and most trusted asset. Dominance rises.
2. **Large coins follow.** As Bitcoin gains slow, profits move into the next tier of established coins.
3. **Small coins and themes.** Later, money reaches smaller and riskier coins, often grouped around a story such as a new technology or sector. Dominance falls sharply.
4. **Everything rises, then everything falls.** The final stage shows the weakest projects gaining the most. It is usually followed by a decline in which smaller coins fall much further than Bitcoin, and dominance rises again as money retreats to safety.

It is a useful map, but it is a tendency drawn from few cycles. The order can compress, skip stages or fail entirely.

## Why the pattern makes sense

It follows from risk appetite. New and cautious money starts with the least risky option. Gains make investors more confident and leave them holding profits to redeploy. Each step out along the risk curve offers larger potential returns and thinner liquidity, so smaller coins move more for each dollar that arrives. The same thin liquidity is why they fall hardest when money leaves.

## Things that distort the measure

- **Stablecoins** are part of total market value in many calculations. Their growth lowers Bitcoin's share without any coin outperforming.
- **New listings** add market value at launch, often at inflated valuations with little supply actually trading.
- **Dead coins** that still carry a nominal price inflate the total.

For a cleaner view, compare Bitcoin directly with a basket you care about: the second-largest coin, or an equal-weighted group of the top twenty excluding stablecoins.

## Practical uses

- **Regime check.** When dominance is rising in a falling market, capital is defensive. It is a poor time to hold small coins.
- **Relative strength.** A coin that holds its value against Bitcoin while dominance rises is showing genuine strength.
- **Late-cycle warning.** A fast collapse in dominance with the smallest coins leading has often marked the most speculative phase.
- **Sizing.** Smaller coins are more volatile versions of the same market. If you hold them, hold less.

## What it will not do

Dominance does not time entries. It moves slowly and trends for months. Use it to decide which part of the market to focus on, then use price, volume and positioning on the individual coin to decide when.

## Key takeaways

- Dominance tracks relative performance, not market direction.
- Money typically moves from Bitcoin to large coins to small ones, then retreats in reverse.
- Stablecoins and new listings distort the headline number; compare directly where you can.
- Use it to choose the hunting ground, not the moment.

=== tokenised-stock-perps | Crypto | Tokenised stock perpetuals: tracking, funding and the weekend gap
> Stock contracts that trade around the clock are convenient, but they do not behave exactly like the shares they follow. The differences are where the risk lives.

## What you are trading

A tokenised stock perpetual is a contract whose price follows a share or a fund. You do not own the share. You have no vote and receive no dividend in the usual way. What you hold is an agreement, settled in a stablecoin, that pays out according to how the reference price moves.

The contract is kept near the real price by two things: an index that follows the underlying market, and funding payments that penalise the side pushing the contract away from that index.

## Three prices to keep apart

- **Last price:** the most recent trade on the contract.
- **Mark price:** a smoothed, fair value used to calculate profit, loss and liquidations. It exists so that one odd trade cannot trigger liquidations.
- **Index price:** the reference taken from the underlying market.

In normal hours these sit within a small fraction of each other. Watching the gap between the contract and its index is a quick health check.

## When the stock market is closed

Shares trade for a limited number of hours on weekdays. The contract trades all day, every day. Outside market hours there is no fresh reference price, so the contract's price reflects only what contract traders think the share is worth.

That has three consequences.

1. **Thin liquidity.** Fewer participants, wider spreads and larger moves on small orders.
2. **Price discovery without an anchor.** News that arrives on a weekend is priced in the contract first. Sometimes that anticipates the reopening correctly; sometimes it overshoots.
3. **The reopening gap.** When the real market opens, the contract snaps toward the new reference. If the two disagree, the adjustment is immediate, and stop orders can be filled far from their level.

For leveraged traders this is the main hazard. A stop that would have protected you in a continuous market offers little protection across a gap.

## Corporate events

Shares pay dividends, split and occasionally merge. A contract has to account for these somehow, usually through adjustments to the index or to funding. The details differ by venue and product. Before holding through an ex-dividend date or a split, find out how the specific contract handles it, because the price of the share will change mechanically on that day.

## Funding on stock contracts

Funding works as it does for coins: the crowded side pays. Two features are worth knowing. Rates on less active contracts can be large and erratic. And during long closures, funding can drift as the contract and its last known reference diverge. If you hold for days, add up what you have paid or received; it can be a meaningful share of the result.

## Leveraged funds inside a leveraged product

Some contracts track funds that are themselves leveraged, such as three-times daily funds on a sector. These funds reset every day and lose value in choppy markets through a compounding effect. Trading a leveraged contract on a leveraged fund stacks two layers of amplification. Moves that look ordinary on the underlying sector become very large on the position.

## Practical rules

- Reduce size or flatten before weekends and holidays if your stop would not survive a gap.
- Check the spread before trading outside market hours; it tells you what liquidity is really like.
- Know the mark price and where your liquidation sits relative to it.
- Treat backtests on these contracts with care around market opens, where fills are least realistic.

## Key takeaways

- A stock perpetual follows a share but is not the share.
- Outside market hours the contract has no fresh anchor and liquidity is thin.
- Gaps at the reopening are the largest practical risk for leveraged positions.
- Funding and corporate events can change the outcome on multi-day holds.

=== crypto-market-microstructure | Crypto | Order books, spreads and slippage: the hidden costs of every crypto trade
> The price on the screen is not the price you get. Understanding how orders actually meet is the difference between a strategy that works on paper and one that works in an account.

## The order book

Every market is a list of offers to buy (bids) and offers to sell (asks) at different prices. The highest bid and the lowest ask are the best prices available. The gap between them is the spread. The quantity resting at each price is depth.

When you send a market order to buy, you take the cheapest asks first. If your order is larger than what is offered at the best price, it continues into the next price, then the next. The average price you pay is worse than the one you saw. That difference is slippage.

## Makers and takers

An order that rests in the book and waits is a maker order: it adds liquidity. An order that executes immediately against resting orders is a taker order: it removes liquidity. Exchanges charge takers more, and sometimes pay makers, because makers are what make the market usable.

The trade-off is certainty. A market order is certain to fill and uncertain in price. A limit order is certain in price and may not fill at all, and it tends to fill precisely when the market is moving against you.

## What the spread tells you

A tight spread with deep quantities means many participants are competing to trade. A wide spread means the opposite. Spreads widen in three situations worth remembering:

- **Small or new coins,** where few market makers are active.
- **Quiet hours,** particularly weekends.
- **Stress.** When price moves violently, market makers protect themselves by quoting wider or pulling orders. Liquidity is least available when it is most wanted.

## Displayed depth is not real depth

Resting orders can be cancelled in milliseconds. Large visible orders are sometimes placed to create an impression and removed before they can be hit. A book that looks deep in calm conditions can empty in a second. A more reliable gauge is how much volume actually trades, and how far price moves when it does.

## Measuring your own costs

For any strategy, total cost per round trip is roughly:

- taker fee on entry, plus
- taker fee on exit, plus
- half the spread each way, plus
- slippage beyond the best price, plus
- funding for the time held.

For a liquid coin and a modest order this may be around a tenth of a percent. For a small coin or a large order it can be many times that. A strategy that averages a 0.3% gain per trade can be fully profitable on Bitcoin and unprofitable on a thin coin, with identical signals.

## Reducing the damage

- **Trade liquid markets** when your edge is small.
- **Use limit orders** for entries that are not urgent; accept that some will be missed.
- **Split large orders** over time rather than hitting the book at once.
- **Avoid trading into news** unless that is your strategy; spreads are widest in the first seconds.
- **Model costs in backtests.** Include fees and a realistic slippage figure, and assume entry on the next candle, not on the candle that produced the signal.

## Why this matters more than indicators

Two traders with the same signals can end the year far apart purely because of execution. Costs are the one part of trading that is certain. Every unit saved goes directly to the result, with no forecasting required.

## Key takeaways

- You trade against the book, not against the last price.
- Spread and depth vary by coin, by hour and by market stress.
- Add fees, spread, slippage and funding to find your true cost.
- Small edges only survive in liquid markets with careful execution.

=== volatility-targeting-crypto | Crypto | Volatility targeting: sizing crypto positions so that risk stays constant
> Most traders hold the same position size whether the market is calm or wild. Scaling size to volatility is a simple change that tends to smooth returns and limit damage.

## The problem with fixed size

Crypto volatility is not constant. A coin can move 1% a day for weeks and then 8% a day for a fortnight. A position that felt comfortable in the quiet period carries several times more risk in the wild one, without the trader having changed anything.

Fixed sizing therefore means taking the least risk when conditions are calm and the most risk when they are dangerous. That is the reverse of what most people intend.

## The idea

Decide how much risk you want to carry, expressed as volatility. Measure how volatile the asset currently is. Hold a position sized so that the two match.

In its simplest form:

position weight = target volatility ÷ current volatility

If your target is 20% a year and the coin is running at 80%, hold a quarter of your capital in it. If volatility falls to 40%, hold half. If it rises to 160%, hold an eighth.

## Measuring current volatility

The standard approach uses the variation in daily returns over a recent window, such as the last 20 or 30 days, scaled up to an annual figure. Shorter windows react faster and trade more. Longer windows are steadier and slower.

An alternative that many traders prefer is the average true range, which measures the typical daily price range including gaps. It is the same idea expressed in price units, and it is what stop-loss rules based on "two times ATR" use.

## Why it works

Volatility clusters. Wild days tend to be followed by wild days and calm by calm. So recent volatility is a reasonable forecast of near-term volatility, far more predictable than direction is.

There is also a relationship between volatility and outcomes. The largest losses tend to occur in high-volatility periods. Reducing exposure in those periods cuts the worst drawdowns, and those are what do lasting damage to an account.

## What it costs

- **More trading.** Adjusting size as volatility changes generates transactions and fees. Rebalancing only when the target weight moves by a set amount helps.
- **Lag.** Volatility is measured after the fact. The first violent day arrives at full size.
- **Smaller wins in explosive rallies.** Sharp upward moves are also high volatility, so the method trims exposure during some of the best periods.
- **False comfort in quiet markets.** Very low volatility produces large positions just before conditions change. A cap on maximum size or leverage is essential.

## Linking it to stops

Volatility targeting and stop-based sizing are two views of the same principle. If your stop is placed a multiple of the average range away from entry and you risk a fixed percentage of the account per trade, your position automatically shrinks when ranges widen. This is how a rule such as "risk 3% of the balance per trade with a stop at two times ATR" behaves: the stop gets wider in a volatile market and the position gets smaller to compensate.

## A sensible starting framework

1. Choose a risk per trade you could lose ten times in a row without changing your behaviour.
2. Set the stop from volatility, not from a round number.
3. Derive size from the two.
4. Cap total leverage regardless of what the formula says.
5. Review the cap and the risk figure only when calm, never during a drawdown.

## Key takeaways

- Fixed position sizes take the most risk at the worst times.
- Sizing inversely to volatility keeps risk roughly constant.
- It reduces deep drawdowns at the cost of some upside and extra trading.
- Always cap maximum size, because quiet markets invite oversized positions.
