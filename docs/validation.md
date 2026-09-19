# Validating form input

How to use the validators and formatters on a real form. Two examples: plain
JavaScript, and React.

## The rules in one place

| Field         | Validator             | Accepts                                                                        |
| ------------- | --------------------- | ------------------------------------------------------------------------------ |
| Mobile number | `isValidMobileNumber` | 09 range, plus 0813, 0817, 0895, 0896, 0897, 0898. Local, `63`, or `+63` form. |
| TIN           | `isValidTin`          | 9, 12, or 14 digits.                                                           |
| ZIP code      | `isValidZipCode`      | Exactly four digits.                                                           |

Mobile numbers and TINs ignore spaces, dashes, dots, and parentheses. You do
not need to strip anything before calling them. ZIP codes only have
surrounding whitespace trimmed.

Validation is structural. A number can be well formed and still not be in
service, and a TIN can be well formed and not belong to anyone. These functions
catch typos and paste errors, not fictional values.

## Validate on submit, store the normalized value

Validate what the user typed, then store what the formatter returns. Storing
`+639171234567` rather than `0917 123 4567` means two records for the same
person match.

```js
import { formatMobileNumber, formatTin, isValidZipCode } from "ph-toolkit";

const form = document.querySelector("#delivery-form");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const errors = {};

  const mobile = formatMobileNumber(data.get("mobile"));
  if (mobile === null) {
    errors.mobile = "Enter a mobile number like 0917 123 4567.";
  }

  const tin = formatTin(data.get("tin"));
  if (tin === null) {
    errors.tin = "Enter a TIN like 123-456-789.";
  }

  const zipCode = String(data.get("zipCode") ?? "").trim();
  if (!isValidZipCode(zipCode)) {
    errors.zipCode = "Enter a four-digit ZIP code, like 6000 for Cebu City.";
  }

  if (Object.keys(errors).length > 0) {
    showErrors(errors);
    return;
  }

  submit({ mobile, tin, zipCode });
});
```

`formatMobileNumber` and `formatTin` return `null` for anything they cannot
parse, so one call both validates and normalizes. Use `isValidMobileNumber`
when you only want the boolean, such as for a live indicator while typing.

Both formatters accept whatever the field holds, including `null` from a
missing form field, and return `null` rather than throwing. You do not need a
guard before calling them.

## React

Validate on blur rather than on every keystroke. Telling someone their mobile
number is invalid while they are still on the fourth digit is noise.

```jsx
import { useState } from "react";
import { formatMobileNumber, formatTin, isValidZipCode } from "ph-toolkit";

const MESSAGES = {
  mobile: "Enter a mobile number like 0917 123 4567.",
  tin: "Enter a TIN like 123-456-789.",
  zipCode: "Enter a four-digit ZIP code, like 6000 for Cebu City.",
};

function validate({ mobile, tin, zipCode }) {
  return {
    mobile: formatMobileNumber(mobile) === null ? MESSAGES.mobile : null,
    tin: formatTin(tin) === null ? MESSAGES.tin : null,
    zipCode: isValidZipCode(zipCode) ? null : MESSAGES.zipCode,
  };
}

export function DeliveryForm({ onSubmit }) {
  const [values, setValues] = useState({ mobile: "", tin: "", zipCode: "" });
  const [touched, setTouched] = useState({});
  const errors = validate(values);

  function change(field) {
    return (event) => setValues({ ...values, [field]: event.target.value });
  }

  function blur(field) {
    return () => setTouched({ ...touched, [field]: true });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setTouched({ mobile: true, tin: true, zipCode: true });

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    // Store the normalized values, not what was typed.
    onSubmit({
      mobile: formatMobileNumber(values.mobile),
      tin: formatTin(values.tin),
      zipCode: values.zipCode.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label>
        Mobile number
        <input
          name="mobile"
          inputMode="tel"
          value={values.mobile}
          onChange={change("mobile")}
          onBlur={blur("mobile")}
          aria-invalid={Boolean(touched.mobile && errors.mobile)}
          aria-describedby={
            touched.mobile && errors.mobile ? "mobile-error" : undefined
          }
        />
        {touched.mobile && errors.mobile && (
          <p id="mobile-error">{errors.mobile}</p>
        )}
      </label>

      <label>
        TIN
        <input
          name="tin"
          inputMode="numeric"
          value={values.tin}
          onChange={change("tin")}
          onBlur={blur("tin")}
          aria-invalid={Boolean(touched.tin && errors.tin)}
          aria-describedby={touched.tin && errors.tin ? "tin-error" : undefined}
        />
        {touched.tin && errors.tin && <p id="tin-error">{errors.tin}</p>}
      </label>

      <label>
        ZIP code
        <input
          name="zipCode"
          inputMode="numeric"
          maxLength={4}
          value={values.zipCode}
          onChange={change("zipCode")}
          onBlur={blur("zipCode")}
          aria-invalid={Boolean(touched.zipCode && errors.zipCode)}
          aria-describedby={
            touched.zipCode && errors.zipCode ? "zip-error" : undefined
          }
        />
        {touched.zipCode && errors.zipCode && (
          <p id="zip-error">{errors.zipCode}</p>
        )}
      </label>

      <button type="submit">Save</button>
    </form>
  );
}
```

## Showing the number back

Store E.164, display something readable. The library normalizes but does not
pretty-print, so do it where you render:

```js
const stored = formatMobileNumber("0917 123 4567"); // "+639171234567"
const display = stored.replace(/^\+63(\d{3})(\d{3})(\d{4})$/, "0$1 $2 $3");
// "0917 123 4567"
```

## Amounts

`formatPeso` takes a number, not a string. Parse the input first, and let
`formatPeso` reject anything that is not finite:

```js
import { formatPeso } from "ph-toolkit";

formatPeso(Number("1234.5")); // "₱1,234.50"
formatPeso(Number("")); // "₱0.00", because Number("") is 0
formatPeso(Number("abc")); // null, because Number("abc") is NaN
```

`Number("")` is `0`, so check for an empty field before parsing if an empty
amount is not the same as zero in your form.

Two options are available:

```js
formatPeso(1234.5, { decimals: 0 }); // "₱1,235"
formatPeso(1234.5, { locale: "fil-PH" }); // "₱1,234.50"
```

`decimals` must be a whole number, and the locale must be a valid BCP 47 tag.
Anything else returns `null` rather than throwing.

## Validating an address

Address fields are a different problem. See
[Building a cascading address selector](address-selector.md).
