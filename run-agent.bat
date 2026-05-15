@echo off
echo ============================================
echo  Hassle Free Travels — Agent Runner
echo ============================================
echo.

cd /d %~dp0
call agents\.venv\Scripts\activate
set PYTHONPATH=%~dp0agents\src;%~dp0agents

if "%1"=="" goto usage

:: SEO & Content (1–10)
if "%1"=="1"  ( echo [Agent #1]  SEO Strategist          & python agents\seo\seo_strategist.py    & goto end )
if "%1"=="2"  ( echo [Agent #2]  Keyword Researcher       & python agents\seo\keyword_researcher.py & goto end )
if "%1"=="3"  ( echo [Agent #3]  Content Optimiser        & python agents\seo\content_optimiser.py  & goto end )
if "%1"=="4"  ( echo [Agent #4]  Technical SEO            & python agents\seo\technical_seo.py      & goto end )
if "%1"=="5"  ( echo [Agent #5]  AEO Specialist           & python agents\seo\aeo_specialist.py     & goto end )
if "%1"=="6"  ( echo [Agent #6]  GEO Specialist           & python agents\seo\geo_specialist.py     & goto end )
if "%1"=="7"  ( echo [Agent #7]  Link Building            & python agents\seo\link_building.py      & goto end )
if "%1"=="8"  ( echo [Agent #8]  Analytics Manager        & python agents\seo\analytics_manager.py  & goto end )
if "%1"=="9"  ( echo [Agent #9]  Competitor Intel         & python agents\seo\competitor_intel.py   & goto end )
if "%1"=="10" ( echo [Agent #10] Content Auditor          & python agents\seo\content_auditor.py    & goto end )

:: Technical & Conversion (11–13)
if "%1"=="11" ( echo [Agent #11] Schema Markup            & python agents\seo\schema_markup.py         & goto end )
if "%1"=="12" ( echo [Agent #12] CRO Specialist           & python agents\seo\cro_specialist.py        & goto end )
if "%1"=="13" ( echo [Agent #13] Booking Abandonment      & python agents\leads\booking_abandonment.py & goto end )

:: Social Media (14–19)
if "%1"=="14" ( echo [Agent #14] Social Promotion         & python agents\social\social_promotion.py   & goto end )
if "%1"=="15" ( echo [Agent #15] Social Copywriter        & python agents\social\social_copywriter.py  & goto end )
if "%1"=="16" ( echo [Agent #16] Scheduler                & python agents\social\scheduler.py          & goto end )
if "%1"=="17" ( echo [Agent #17] Social Listening         & python agents\social\social_listening.py   & goto end )
if "%1"=="18" ( echo [Agent #18] UGC / Testimonial        & python agents\social\ugc_testimonial.py    & goto end )
if "%1"=="19" ( echo [Agent #19] Influencer Outreach      & python agents\social\influencer_outreach.py & goto end )

:: Lead CRM (20–23)
if "%1"=="20" ( echo [Agent #20] Instagram DM             & python agents\social\instagram_dm.py       & goto end )
if "%1"=="21" ( echo [Agent #21] Lead Scoring             & python agents\leads\lead_scoring.py        & goto end )
if "%1"=="22" ( echo [Agent #22] WhatsApp Alerts          & python agents\leads\whatsapp_alerts.py     & goto end )
if "%1"=="23" ( echo [Agent #23] Upsell & Cross-sell      & python agents\leads\upsell_crosssell.py    & goto end )

:: Ads (24)
if "%1"=="24" ( echo [Agent #24] Meta Ads Intelligence    & python agents\ops\meta_ads_intelligence.py & goto end )

:: Pricing & Revenue (25–27)
if "%1"=="25" ( echo [Agent #25] Dynamic Pricing          & python agents\pricing\dynamic_pricing.py   & goto end )
if "%1"=="26" ( echo [Agent #26] Revenue Forecast         & python agents\pricing\revenue_forecast.py  & goto end )
if "%1"=="27" ( echo [Agent #27] Group Fill Rate          & python agents\main.py                      & goto end )

:: Operations (28–31)
if "%1"=="28" ( echo [Agent #28] Itinerary Builder        & python agents\ops\itinerary_builder.py     & goto end )
if "%1"=="29" ( echo [Agent #29] Vendor Monitor           & python agents\ops\vendor_monitor.py        & goto end )
if "%1"=="30" ( echo [Agent #30] Visa Advisory            & python agents\ops\visa_advisory.py         & goto end )
if "%1"=="31" ( echo [Agent #31] Customer Experience      & python agents\ops\customer_experience.py   & goto end )

:: Email (32–33)
if "%1"=="32" ( echo [Agent #32] Email Nurture            & python agents\email\email_nurture.py       & goto end )
if "%1"=="33" ( echo [Agent #33] Newsletter Curator       & python agents\email\newsletter_curator.py  & goto end )

:: PR & Brand (34–36)
if "%1"=="34" ( echo [Agent #34] PR Outreach              & python agents\pr\pr_outreach.py            & goto end )
if "%1"=="35" ( echo [Agent #35] Review & Reputation      & python agents\pr\review_reputation.py      & goto end )
if "%1"=="36" ( echo [Agent #36] Thought Leadership       & python agents\pr\thought_leadership.py     & goto end )

:: Research (37–39)
if "%1"=="37" ( echo [Agent #37] Trend Forecaster         & python agents\research\trend_forecaster.py & goto end )
if "%1"=="38" ( echo [Agent #38] Customer Persona         & python agents\research\customer_persona.py & goto end )
if "%1"=="39" ( echo [Agent #39] Compliance               & python agents\research\compliance.py       & goto end )

:usage
echo Usage: run-agent.bat [1-39]
echo.
echo SEO ^& Content:    1  2  3  4  5  6  7  8  9  10
echo Tech/Conversion:  11 12 13
echo Social Media:     14 15 16 17 18 19
echo Lead CRM:         20 21 22 23
echo Ads:              24
echo Pricing:          25 26 27
echo Operations:       28 29 30 31
echo Email:            32 33
echo PR ^& Brand:       34 35 36
echo Research:         37 38 39

:end
echo.
echo Done.
pause
