/*
  AnyBike Admin KPI Engine
  File: admin-kpis.js

  Purpose:
  One trusted place for Admin HQ business metrics.

  Requires:
  - Supabase client already available as: sb
  - setText(id,value) function available on admin-dashboard.html
  - money(value) function available on admin-dashboard.html
*/

const KPI_ACTIVE_EXCLUDED_STATUSES = [
  "Completed",
  "Closed",
  "Lost",
  "Save for Later"
];

const KPI_CLOSING_SOON_STATUSES = [
  "Negotiating Price & Lead Time",
  "Waiting Customer Decision",
  "Waiting Deposit",
  "Deposit Paid",
  "Waiting Full Payment"
];

function kpiIsActiveStatus(status){
  return !KPI_ACTIVE_EXCLUDED_STATUSES.includes(String(status || "").trim());
}

function kpiIsClosingSoon(status){
  return KPI_CLOSING_SOON_STATUSES.includes(String(status || "").trim());
}

function kpiGetPeriodStart(period){

  const now = new Date();
  const start = new Date(now);

  if(period === "today"){
    start.setHours(0,0,0,0);
    return start;
  }

  if(period === "7"){
    start.setDate(start.getDate() - 7);
    return start;
  }

  if(period === "30"){
    start.setDate(start.getDate() - 30);
    return start;
  }

  if(period === "60"){
    start.setDate(start.getDate() - 60);
    return start;
  }

  if(period === "90"){
    start.setDate(start.getDate() - 90);
    return start;
  }

  if(period === "month"){
    start.setDate(1);
    start.setHours(0,0,0,0);
    return start;
  }

  if(period === "year"){
    start.setMonth(0,1);
    start.setHours(0,0,0,0);
    return start;
  }

  return null;
}

function kpiInPeriod(dateValue, period){
  if(period === "all"){
    return true;
  }

  const start = kpiGetPeriodStart(period);

  if(!start){
    return true;
  }

  if(!dateValue){
    return false;
  }

  const d = new Date(dateValue);

  if(isNaN(d.getTime())){
    return false;
  }

  return d >= start;
}

async function calculateAdminKPIs(period){

  const selectedPeriod = period || "30";

  const result = {
    period:selectedPeriod,
    invoiced:0,
    depositsReceived:0,
    amountDue:0,
    dealsClosingSoon:0,
    activeCustomers:0,
    activeBikeDeals:0,
    activeOperations:0
  };

  const { data: enquiries, error } = await sb
      .from("bike_enquiries")
    .select(`
      id,
      created_at,
      status,
      customer_id,
      customer_email,
      customer_name,
      deal_total_income,
      deal_net_profit,
      deposit_amount,
      deposit_received,
      deposit_received_at,
      balance_due,
      invoice_total,
      invoice_date,
      completed_at,
      actual_gross_profit,
      payment_status
    `)
    .order("created_at", { ascending:false });

  if(error){
    console.error("KPI enquiry load failed:", error);
    return result;
  }

  const rows = enquiries || [];
  const activeCustomerKeys = new Set();

  rows.forEach(function(row){

    const status = String(row.status || "").trim();

    if(kpiIsActiveStatus(status)){
      result.activeBikeDeals += 1;

      const customerKey =
        row.customer_id ||
        row.customer_email ||
        row.customer_name ||
        "";

      if(customerKey){
        activeCustomerKeys.add(String(customerKey).toLowerCase());
      }
    }

    if(kpiIsClosingSoon(status)){
      result.dealsClosingSoon += 1;
    }

    if([
      "Deposit Paid",
      "Waiting Collection",
      "On Site",
      "Ready To Ship",
      "Booked with Move Motorcycles",
      "At Port / Shipping Agent"
    ].includes(status)){
      result.activeOperations += 1;
    }

    const invoiceDate = row.invoice_date || row.completed_at || row.created_at;

    if(
      ["Completed", "Closed"].includes(status) &&
      kpiInPeriod(invoiceDate, selectedPeriod)
    ){
      result.invoiced += Number(row.invoice_total || row.deal_total_income || 0);
    }

    if(kpiInPeriod(row.created_at, selectedPeriod)){
      result.depositsReceived += Number(row.deposit_received || row.deposit_amount || 0);
    }

    if(kpiIsActiveStatus(status)){
      result.amountDue += Number(row.balance_due || 0);
    }

  });

  result.activeCustomers = activeCustomerKeys.size;

  return result;
}

async function loadAdminKPIs(){

  const periodEl = document.getElementById("kpiPeriod");
  const period = periodEl ? periodEl.value : "30";

  const kpis = await calculateAdminKPIs(period);

  setText("kpiInvoiced", money(kpis.invoiced));
  setText("kpiDeposits", money(kpis.depositsReceived));
  setText("kpiAmountDue", money(kpis.amountDue));
  setText("kpiCloseSoon", kpis.dealsClosingSoon);
  setText("kpiActiveCustomers", kpis.activeCustomers);

  return kpis;
}