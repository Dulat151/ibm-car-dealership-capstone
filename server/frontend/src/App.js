import React, { useEffect, useState } from "react";
import "./App.css";

const API = "/djangoapp";
const request = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.status || `HTTP ${response.status}`);
  return data;
};

export default function App() {
  const [page, setPage] = useState("home");
  const [dealers, setDealers] = useState([]);
  const [dealer, setDealer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ userName: "", password: "", email: "" });
  const [reviewForm, setReviewForm] = useState({ name: "", review: "", purchase: false, purchase_date: "", car_make: "", car_model: "", car_year: "" });

  const loadDealers = async (state = "") => {
    try {
      const data = await request(`${API}/get_dealers${state ? `?state=${encodeURIComponent(state)}` : ""}`);
      setDealers(data);
      setPage("dealers");
      setMessage("");
    } catch (e) { setMessage(e.message); }
  };

  const openDealer = async (id) => {
    try {
      const [d, r] = await Promise.all([
        request(`${API}/get_dealer/${id}`),
        request(`${API}/get_dealer_reviews/${id}`)
      ]);
      setDealer(d); setReviews(r); setPage("dealer"); setMessage("");
    } catch (e) { setMessage(e.message); }
  };

  const submitAuth = async (e, mode) => {
    e.preventDefault();
    try {
      const result = await request(`${API}/${mode}`, { method: "POST", body: JSON.stringify(form) });
      setUsername(result.userName || "");
      setMessage(result.status || "Success");
      if (mode === "login") await loadDealers();
      else setPage("login");
    } catch (err) { setMessage(err.message); }
  };

  const logout = async () => {
    try { await request(`${API}/logout`); setUsername(""); setMessage("Logged out"); setPage("home"); }
    catch (e) { setMessage(e.message); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!dealer) return;
    try {
      const result = await request(`${API}/add_review`, {
        method: "POST",
        body: JSON.stringify({ ...reviewForm, dealership: String(dealer.id), name: reviewForm.name || username || "Guest" })
      });
      setMessage(`Review saved. Sentiment: ${result.sentiment}`);
      await openDealer(dealer.id);
    } catch (err) { setMessage(err.message); }
  };

  useEffect(() => { loadDealers(); }, []);

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setPage("home")}>Best Cars Dealership</button>
      <nav>
        <button onClick={() => setPage("home")}>Home</button>
        <button onClick={() => loadDealers()}>Dealers</button>
        {username ? <><span className="welcome">Welcome, {username}</span><button onClick={logout}>Logout</button></> :
          <><button onClick={() => setPage("login")}>Login</button><button onClick={() => setPage("register")}>Register</button></>}
      </nav>
    </header>

    {message && <div className="notice" role="status">{message}</div>}

    <main>
      {page === "home" && <section className="hero">
        <p className="eyebrow">FIND YOUR NEXT CAR</p><h1>Explore trusted car dealerships</h1>
        <p>Browse dealerships, read customer reviews and share your experience.</p>
        <button className="primary" onClick={() => loadDealers()}>Explore dealerships</button>
      </section>}

      {page === "dealers" && <section><div className="section-heading"><div><p className="eyebrow">OUR NETWORK</p><h1>Dealerships</h1></div>
        <div className="filter"><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by state (e.g. Texas)" />
          <button onClick={() => loadDealers(filter.trim())}>Filter</button><button onClick={() => {setFilter(""); loadDealers();}}>All</button></div></div>
        <div className="dealer-grid">{dealers.map(d => <article className="dealer-card" key={d.id}>
          <h2>{d.full_name || d.short_name || `Dealer ${d.id}`}</h2><p>{d.city}, {d.state}</p><p>{d.address}</p>
          <button className="primary" onClick={() => openDealer(d.id)}>View details & reviews</button>
        </article>)}</div>
      </section>}

      {page === "dealer" && dealer && <section>
        <button className="back" onClick={() => loadDealers()}>← All dealerships</button>
        <h1>{dealer.full_name || dealer.short_name}</h1><p>{dealer.address}, {dealer.city}, {dealer.state} {dealer.zip}</p>
        <h2>Customer reviews</h2>
        {reviews.length ? reviews.map((r, i) => <article className="review-card" key={r.id || i}>
          <strong>{r.name || "Customer"}</strong><p>{r.review}</p><small>{r.purchase ? "Verified purchase" : "Customer review"}</small>
        </article>) : <p>No reviews yet.</p>}
        <h2>Post a review</h2>
        <form className="form-card" onSubmit={submitReview}>
          <label>Your name<input value={reviewForm.name} onChange={e => setReviewForm({...reviewForm, name:e.target.value})} /></label>
          <label>Review<textarea required value={reviewForm.review} onChange={e => setReviewForm({...reviewForm, review:e.target.value})} /></label>
          <label className="check"><input type="checkbox" checked={reviewForm.purchase} onChange={e => setReviewForm({...reviewForm, purchase:e.target.checked})}/> I purchased a car here</label>
          <button className="primary">Submit review</button>
        </form>
      </section>}

      {(page === "login" || page === "register") && <section className="auth-wrap">
        <form className="form-card auth-card" onSubmit={e => submitAuth(e, page)}>
          <p className="eyebrow">ACCOUNT</p><h1>{page === "login" ? "Login" : "Create account"}</h1>
          <label>Username<input required value={form.userName} onChange={e => setForm({...form,userName:e.target.value})}/></label>
          {page === "register" && <label>Email<input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></label>}
          <label>Password<input type="password" required value={form.password} onChange={e => setForm({...form,password:e.target.value})}/></label>
          <button className="primary">{page === "login" ? "Login" : "Register"}</button>
          <button type="button" className="text-button" onClick={() => setPage(page === "login" ? "register" : "login")}>
            {page === "login" ? "Create an account" : "I already have an account"}
          </button>
        </form>
      </section>}
    </main>
    <footer>Best Cars Dealership · Full Stack Application</footer>
  </div>;
}
