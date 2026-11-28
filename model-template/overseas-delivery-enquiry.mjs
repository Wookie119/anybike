const deliveryOptions = [
  ['', 'Select if you want a delivery quote'],
  ['uk-port', 'UK port handover to my shipping agent'],
  ['local-port', 'Collect and uncrate at my local port'],
  ['address', 'Deliver in a crate to my home'],
  ['address', 'Deliver in a crate to my workplace'],
  ['', 'Help me choose']
];
const detailFields = [
  ['delivery_uk_port', 'UK handover port', 'uk-port', 100],
  ['delivery_agent', 'Shipping agent or freight forwarder', 'uk-port', 160],
  ['delivery_port', 'Destination port', 'local-port', 100],
  ['delivery_address_area', 'Delivery town or city and postcode', 'address', 120]
];

export function mountOverseasDeliveryFields(form, before) {
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'v2-overseas-delivery';
  const legend = document.createElement('legend');
  legend.textContent = 'Overseas delivery';
  const optionLabel = document.createElement('label');
  optionLabel.textContent = 'Delivery option';
  const select = document.createElement('select');
  select.name = 'delivery_option';
  for (const [index, [part, label]] of deliveryOptions.entries()) {
    const option = new Option(label, index ? label : '');
    option.dataset.part = part;
    select.add(option);
  }
  optionLabel.append(select);
  fieldset.append(legend, optionLabel);
  const inputs = detailFields.map(([name, text, part, maxLength]) => {
    const label = document.createElement('label');
    label.textContent = text;
    const input = document.createElement('input');
    input.name = name;
    input.maxLength = maxLength;
    label.append(input);
    fieldset.append(label);
    return {label, input, part};
  });
  function updateFields() {
    const part = select.selectedOptions[0]?.dataset.part;
    for (const field of inputs) {
      field.label.hidden = field.part !== part;
      field.input.disabled = field.label.hidden;
    }
  }
  select.addEventListener('change', updateFields);
  form.addEventListener('reset', () => queueMicrotask(updateFields));
  updateFields();
  form.insertBefore(fieldset, before);
}

export function withOverseasDeliveryDetails(values) {
  const {delivery_option, ...enquiry} = values;
  const lines = delivery_option ? ['Delivery option: ' + delivery_option] : [];
  for (const [name, label] of detailFields) {
    const value = enquiry[name]?.trim();
    if (delivery_option && value) lines.push(label + ': ' + value);
    delete enquiry[name];
  }
  if (lines.length) enquiry.message = [enquiry.message.trim(), '', ...lines].join('\n');
  return enquiry;
}
