import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from "libphonenumber-js";

const COUNTRIES = [
  { name: "India", code: "IN", dial: "+91", min: 10, max: 10 },
  { name: "United States", code: "US", dial: "+1", min: 10, max: 10 },
  { name: "United Kingdom", code: "GB", dial: "+44", min: 10, max: 10 },
  { name: "Canada", code: "CA", dial: "+1", min: 10, max: 10 },
  { name: "Australia", code: "AU", dial: "+61", min: 9, max: 9 },
  { name: "United Arab Emirates", code: "AE", dial: "+971", min: 9, max: 9 },
  { name: "Saudi Arabia", code: "SA", dial: "+966", min: 9, max: 9 },
  { name: "Singapore", code: "SG", dial: "+65", min: 8, max: 8 },
  { name: "Germany", code: "DE", dial: "+49", min: 7, max: 13 },
  { name: "France", code: "FR", dial: "+33", min: 9, max: 9 },
  { name: "Japan", code: "JP", dial: "+81", min: 9, max: 10 },
  { name: "China", code: "CN", dial: "+86", min: 11, max: 11 },
  { name: "Pakistan", code: "PK", dial: "+92", min: 10, max: 10 },
  { name: "Bangladesh", code: "BD", dial: "+880", min: 10, max: 10 },
  { name: "Nepal", code: "NP", dial: "+977", min: 10, max: 10 },
  { name: "Sri Lanka", code: "LK", dial: "+94", min: 9, max: 9 },
  { name: "South Africa", code: "ZA", dial: "+27", min: 9, max: 9 },
  { name: "New Zealand", code: "NZ", dial: "+64", min: 8, max: 10 },
  { name: "Ireland", code: "IE", dial: "+353", min: 9, max: 9 },
  { name: "Italy", code: "IT", dial: "+39", min: 6, max: 11 },
  { name: "Netherlands", code: "NL", dial: "+31", min: 9, max: 9 },
  { name: "Brazil", code: "BR", dial: "+55", min: 10, max: 11 },
  { name: "Mexico", code: "MX", dial: "+52", min: 10, max: 10 },
  { name: "Malaysia", code: "MY", dial: "+60", min: 9, max: 10 },
  { name: "Indonesia", code: "ID", dial: "+62", min: 9, max: 12 },
  { name: "South Korea", code: "KR", dial: "+82", min: 9, max: 10 },
  { name: "Qatar", code: "QA", dial: "+974", min: 8, max: 8 },
  { name: "Kuwait", code: "KW", dial: "+965", min: 8, max: 8 },
  { name: "Oman", code: "OM", dial: "+968", min: 8, max: 8 },
];

function findCountry(value) {
  if (!value) return COUNTRIES[0];

  return (
    [...COUNTRIES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((country) => value.startsWith(country.dial)) || COUNTRIES[0]
  );
}

function CountryFlag({ code }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
      alt={`${code} flag`}
      width="26"
      height="19"
      loading="lazy"
      style={{
        display: "block",
        width: 26,
        height: 19,
        flexShrink: 0,
        objectFit: "cover",
        borderRadius: 3,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
      }}
    />
  );
}

function validateNumber(number, country) {
  if (!number) {
    return { valid: !country.required, error: "" };
  }

  const lengthResult = validatePhoneNumberLength(
    number,
    country.code
  );

  if (lengthResult === "TOO_SHORT") {
    return {
      valid: false,
      error: `This number is too short for ${country.name}.`,
    };
  }

  if (
    lengthResult === "TOO_LONG" ||
    lengthResult === "INVALID_LENGTH"
  ) {
    return {
      valid: false,
      error: `This number has an invalid length for ${country.name}.`,
    };
  }

  if (lengthResult === "NOT_A_NUMBER") {
    return {
      valid: false,
      error: "Please enter a valid phone number.",
    };
  }

  const parsed = parsePhoneNumberFromString(
    number,
    country.code
  );

  if (!parsed || !parsed.isValid()) {
    return {
      valid: false,
      error: `Please enter a valid phone number for ${country.name}.`,
    };
  }

  return { valid: true, error: "" };
}

function PhoneInput({
  id,
  name,
  value = "",
  onChange,
  required = false,
  disabled = false,
  placeholder = "Enter phone number",
}) {
  const generatedId = useId();
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const countrySelectId = `${id || generatedId}-country`;
  const errorId = `${id || generatedId}-phone-error`;

  const normalizedValue =
    typeof value === "string" ? value : "";

  const [country, setCountry] = useState(() =>
    findCountry(normalizedValue)
  );

  const [number, setNumber] = useState(() => {
    const selected = findCountry(normalizedValue);

    return normalizedValue.startsWith(selected.dial)
      ? normalizedValue
          .slice(selected.dial.length)
          .replace(/\D/g, "")
      : "";
  });

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const validation = useMemo(
    () => validateNumber(number, { ...country, required }),
    [number, country, required]
  );

  useEffect(() => {
    if (!normalizedValue) {
      setNumber("");
      return;
    }

    const selected = normalizedValue.startsWith(country.dial)
      ? country
      : findCountry(normalizedValue);

    setCountry(selected);

    setNumber(
      normalizedValue.startsWith(selected.dial)
        ? normalizedValue
            .slice(selected.dial.length)
            .replace(/\D/g, "")
        : ""
    );
  }, [normalizedValue]);

  useEffect(() => {
    if (!inputRef.current) return;

    inputRef.current.setCustomValidity(
      number && !validation.valid ? validation.error : ""
    );
  }, [number, validation]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return COUNTRIES;

    return COUNTRIES.filter((item) =>
      `${item.name} ${item.dial} ${item.code}`
        .toLowerCase()
        .includes(query)
    );
  }, [search]);

  const emitValue = (selectedCountry, nationalNumber) => {
    const digits = nationalNumber.replace(/\D/g, "");

    onChange?.(
      digits ? `${selectedCountry.dial}${digits}` : ""
    );
  };

  const selectCountry = (selected) => {
    setCountry(selected);
    setIsOpen(false);
    setSearch("");
    emitValue(selected, number);
  };

  const updateNumber = (input) => {
    const digits = input.replace(/\D/g, "");

    setNumber(digits);
    emitValue(country, digits);
  };

  const styles = {
    wrapper: {
      position: "relative",
      width: "100%",
      minWidth: 0,
    },
    countryButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      width: "100%",
      minHeight: 46,
      padding: "10px 12px",
      border: "1px solid var(--border)",
      borderRadius: 9,
      background: "var(--input-bg)",
      color: "var(--text-heading)",
      fontFamily: "var(--sans)",
      fontSize: 13,
      textAlign: "left",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
    },
    countryInfo: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      minWidth: 0,
    },
    countryName: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    dialCode: {
      marginLeft: "auto",
      color: "var(--text-muted)",
      fontSize: 12,
      whiteSpace: "nowrap",
    },
    dropdown: {
      position: "absolute",
      top: "calc(100% + 7px)",
      left: 0,
      zIndex: 1000,
      width: "min(320px, 90vw)",
      maxHeight: 330,
      overflow: "hidden",
      border: "1px solid var(--border)",
      borderRadius: 12,
      background: "var(--surface-glass)",
      boxShadow: "var(--shadow)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
    },
    searchBox: {
      position: "sticky",
      top: 0,
      zIndex: 1,
      padding: 10,
      borderBottom: "1px solid var(--border)",
      background: "var(--surface-glass)",
    },
    searchInput: {
      width: "100%",
      minHeight: 40,
      padding: "9px 11px",
      border: "1px solid var(--border)",
      borderRadius: 8,
      outline: "none",
      background: "var(--input-bg)",
      color: "var(--text-heading)",
      fontFamily: "var(--sans)",
      fontSize: 13,
      boxSizing: "border-box",
    },
    countryList: {
      maxHeight: 260,
      overflowY: "auto",
      padding: 5,
    },
    countryOption: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      minHeight: 42,
      padding: "8px 10px",
      border: "none",
      borderRadius: 7,
      background: "transparent",
      color: "var(--text-heading)",
      fontFamily: "var(--sans)",
      fontSize: 13,
      textAlign: "left",
      cursor: "pointer",
    },
    empty: {
      padding: 18,
      color: "var(--text-muted)",
      fontSize: 13,
      textAlign: "center",
    },
  };

  return (
    <div className="forma-phone-input">
      <div className="forma-phone-country" ref={wrapperRef}>
        <label
          htmlFor={countrySelectId}
          className="forma-phone-country-label"
        >
          Country code
        </label>

        <div style={styles.wrapper}>
          <button
            id={countrySelectId}
            type="button"
            style={styles.countryButton}
            onClick={() => {
              if (!disabled) {
                setIsOpen((open) => !open);
                setSearch("");
              }
            }}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label={`Selected country: ${country.name}, ${country.dial}`}
          >
            <span style={styles.countryInfo}>
              <CountryFlag code={country.code} />
              <span style={styles.countryName}>
                {country.name}
              </span>
              <span style={styles.dialCode}>
                {country.dial}
              </span>
            </span>

            <span style={styles.dialCode}>
              {isOpen ? "▲" : "▼"}
            </span>
          </button>

          {isOpen && (
            <div style={styles.dropdown}>
              <div style={styles.searchBox}>
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search country or dial code..."
                  style={styles.searchInput}
                  aria-label="Search countries"
                />
              </div>

              <div
                style={styles.countryList}
                role="listbox"
                aria-label="Countries"
              >
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      role="option"
                      aria-selected={country.code === item.code}
                      style={{
                        ...styles.countryOption,
                        background:
                          country.code === item.code
                            ? "var(--primary-soft)"
                            : "transparent",
                      }}
                      onClick={() => selectCountry(item)}
                    >
                      <CountryFlag code={item.code} />
                      <span>{item.name}</span>
                      <span style={styles.dialCode}>
                        {item.dial}
                      </span>
                    </button>
                  ))
                ) : (
                  <div style={styles.empty}>
                    No countries found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="forma-phone-number">
        <label htmlFor={id}>Phone number</label>

        <div className="forma-phone-number-control">
          <span>{country.dial}</span>

          <input
            ref={inputRef}
            id={id}
            name={name}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder={placeholder}
            value={number}
            required={required}
            disabled={disabled}
            aria-invalid={Boolean(number && !validation.valid)}
            aria-describedby={validation.error ? errorId : undefined}
            onChange={(event) =>
              updateNumber(event.target.value)
            }
          />
        </div>
      </div>

      {!validation.valid && number && (
        <p
          id={errorId}
          className="forma-phone-error"
          role="alert"
        >
          {validation.error}
        </p>
      )}

      <input
        type="hidden"
        name={`${name}-international`}
        value={number ? `${country.dial}${number}` : ""}
      />
    </div>
  );
}

export default PhoneInput;