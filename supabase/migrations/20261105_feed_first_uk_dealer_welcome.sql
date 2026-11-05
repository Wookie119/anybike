-- Feed-first welcome for verified UK motorcycle dealers. No messages are dispatched by this migration.
update public.anybike_onboarding_templates
set subject=$subject$Welcome to AnyBike — connect your motorcycle stock$subject$,body=$body$Hello,

Welcome to AnyBike. Your UK dealership is approved to buy, sell and trade motorcycles through our network.

OUR FIRST STEP: CONNECT YOUR EXISTING MOTORCYCLE STOCK

We would like to help connect your current dealership stock system to AnyBike through a permanent feed. The aim is to bring over motorcycles, photographs, prices and availability, with regular updates — so you do not have another stock list to maintain manually.

CONNECT YOUR STOCK / START A FEED REQUEST
https://www.anybike.co.uk/dealer-connect-stock.html

Choose your existing stock provider (such as Dealerwebs, Click Dealer, EVOPOS, Catalyst, Pyramid, Media Links or another provider). The page will help you prepare a feed request to send from your own email account, copying AnyBike so we can help with the next steps. Opening the email draft does not send it; you must send it and then confirm on the page.

If a permanent feed is not available, you can upload a CSV or Excel stock list as an alternative.

WHY CONNECT?

• Reach suitable international trade buyers without advertising to UK retail customers.
• When an overseas deal is agreed, your dealership sells to AnyBike and we coordinate the export.
• Choose whether selected motorcycles are offered confidentially to approved UK motorcycle dealers.
• Keep control of pricing, availability and what is offered. Feed data is reviewed before publication.

AnyBike is free for approved UK motorcycle dealers, with no listing fees or AnyBike sales commission.

You can also view trade opportunities and submit confidential offers:
https://www.anybike.co.uk/trade-opportunities.html

Already requested a feed? Thank you — there is no need to request it again.

If you are unsure who supplies your stock system, simply reply to this message and we will help identify the next step.

Kind regards,
The AnyBike Team
www.anybike.co.uk$body$
where journey='uk_dealer' and template_key='welcome';