import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import CustomerNavbar from "../components/CustomerNavbar";
import { useRef } from "react";  

const CurrencyConverter = () => {
  const API_KEY = "e66094df039cea57c93c0c0f";
  const [rates, setRates] = useState({});
  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("PKR");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(
          `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`
        );

        const data = await res.json();

        if (data.result !== "success") {
          throw new Error("Failed to load exchange rates");
        }

        setRates(data.conversion_rates);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  // Format numbers with adaptive precision
  const formatNumber = (num) => {
    if (num === null || num === undefined || Number.isNaN(num)) return 'N/A';
    const abs = Math.abs(num);
    if (abs === 0) return '0.00';
    if (abs < 0.01) return num.toFixed(6); // show micro precision for very small values
    if (abs < 1) return num.toFixed(4);
    return num.toFixed(2);
  };

  // Convert currency
  const convertCurrency = () => {
    setError('');

    if (!rates || Object.keys(rates).length === 0) {
      setError('Exchange rates not loaded');
      return;
    }

    if (!rates[from] || !rates[to]) {
      setError('Selected currency rates not available');
      return;
    }

    const amt = Number(amount);
    if (Number.isNaN(amt)) {
      setError('Please enter a valid amount');
      return;
    }

    const usdToFrom = 1 / rates[from];
    const finalRate = usdToFrom * rates[to];
    const convertedNumber = amt * finalRate;

    setResult(formatNumber(convertedNumber));
  };

  // Mock historical data for PKR (replace with real API later)
  const historicalData = [
    { day: "Mon", rate: 278 },
    { day: "Tue", rate: 279 },
    { day: "Wed", rate: 277 },
    { day: "Thu", rate: 280 },
    { day: "Fri", rate: 281 },
    { day: "Sat", rate: 282 },
    { day: "Sun", rate: 283 },
  ];

  if (loading) {
    return (
      <>
        <CustomerNavbar />
        <div className="flex justify-center mt-10 text-xl font-semibold">
          Loading exchange rates...
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <CustomerNavbar />
        <div className="flex justify-center mt-10 text-red-600 text-lg">
          {error}
        </div>
      </>
    );
  }

  const topCurrencies = ["PKR", "EUR", "GBP", "AED", "CAD", "AUD", "INR", "SAR"];

  return (
    <>
      <CustomerNavbar />

      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Currency Converter</h1>

        {/* MAIN SPLIT SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* LEFT SIDE */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <h2 className="text-xl font-bold mb-4">Convert Currency</h2>

            <div>
              <label className="block mb-2 font-medium text-gray-700">Amount</label>
              <input
                type="number"
                value={amount}
                min="0"
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-gray-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">From</label>
                <CustomSelect
                  options={Object.keys(rates)}
                  value={from}
                  onChange={setFrom}
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">To</label>
                <CustomSelect
                  options={Object.keys(rates)}
                  value={to}
                  onChange={setTo}
                />
              </div>
            </div>

            <button
              onClick={convertCurrency}
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              Convert
            </button>

            {result !== null && (
              <div className="text-center mt-4 text-xl font-semibold">
                {amount} {from} ={" "}
                <span className="text-gray-900">
                  {result} {to}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT SIDE */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-bold mb-6">Live Exchange Rates (USD →)</h2>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="pb-3 border-b font-semibold">Currency</th>
                  <th className="pb-3 border-b font-semibold">Rate</th>
                </tr>
              </thead>
              <tbody>
                {topCurrencies.map((currency) => (
                  <tr key={currency} className="border-b last:border-none">
                    <td className="py-3 font-medium">{currency}</td>
                    <td className="py-3">{rates[currency] ? formatNumber(rates[currency]) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-4 text-sm text-gray-500 text-center">
              Rates powered by ExchangeRate-API
            </p>
          </div>

        </div>

        {/* Graph removed by request */}

      </div>
    </>
  );
};

// Small custom select that always opens downward and is positioned within the flow
function CustomSelect({ options = [], value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full text-left p-3 border rounded-xl bg-white flex justify-between items-center"
      >
        <span>{value}</span>
        <svg className={`w-4 h-4 ml-2 transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-auto bg-white border rounded-lg shadow-lg">
          {options.map((opt) => (
            <li
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${opt === value ? 'bg-gray-100 font-medium' : ''}`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CurrencyConverter;
