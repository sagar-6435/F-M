import { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, Save, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRANCHES } from "@/lib/booking-data";
import { API_BASE } from "@/lib/api";

interface PricingItem {
  id?: string;
  name?: string;
  price: number;
  originalPrice?: number;
  offerPrice?: number;
  description?: string;
  image?: string;
  service?: string;
  duration?: number;
}

const AdminPricing = () => {
  const [activeTab, setActiveTab] = useState<"services" | "cakes" | "decorations">("services");
  const [pricing, setPricing] = useState<Record<string, Record<number, number>>>({});
  const [cakes, setCakes] = useState<PricingItem[]>([]);
  const [decorations, setDecorations] = useState<PricingItem[]>([]);
  const [decorationPrice, setDecorationPrice] = useState(1500);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<PricingItem>({} as PricingItem);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<"branch-1" | "branch-2">("branch-1");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchPricing();
    }
  }, [isLoggedIn, token, selectedBranch]);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setIsLoggedIn(true);
      } else {
        alert("Invalid password");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-24">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-primary glow-gold">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-6 text-center font-display text-2xl font-bold text-foreground">Admin Login</h2>
          
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-xl border border-border bg-muted px-4 py-3 text-foreground placeholder:text-muted-foreground font-body focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleLogin}
            className="w-full rounded-xl bg-gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:scale-[1.02] font-body"
          >
            Login
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground font-body">
            Password: admin123
          </p>
        </div>
      </div>
    );
  }

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [pricingRes, cakesRes, decorationsRes, decorationPriceRes] = await Promise.all([
        fetch(`${API_BASE}/pricing?branch=${encodeURIComponent(selectedBranch)}`, { headers }),
        fetch(`${API_BASE}/cakes?branch=${encodeURIComponent(selectedBranch)}`, { headers }),
        fetch(`${API_BASE}/decorations?branch=${encodeURIComponent(selectedBranch)}`, { headers }),
        fetch(`${API_BASE}/decoration-price?branch=${encodeURIComponent(selectedBranch)}`, { headers }),
      ]);

      if (pricingRes.ok) {
        const pricing = await pricingRes.json();
        console.log("Fetched pricing:", pricing);
        setPricing(pricing);
      }
      if (cakesRes.ok) {
        const cakes = await cakesRes.json();
        console.log("Fetched cakes:", cakes);
        setCakes(cakes);
      }
      if (decorationsRes.ok) {
        const decorations = await decorationsRes.json();
        console.log("Fetched decorations:", decorations);
        setDecorations(decorations);
      }
      if (decorationPriceRes.ok) {
        const data = await decorationPriceRes.json();
        console.log("Fetched decoration price:", data);
        setDecorationPrice(data.decorationPrice);
      }
    } catch (error) {
      console.error("Error fetching pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditService = (service: string, duration: number, price: number) => {
    setEditingId(`${service}-${duration}`);
    setEditValues({ service, duration, price });
  };

  const handleEditCake = (cake: PricingItem) => {
    setEditingId(cake.id || "");
    setEditValues(cake);
  };

  const handleEditDecoration = (decoration: PricingItem) => {
    setEditingId(decoration.id || "");
    setEditValues(decoration);
  };

  const handleSaveService = async () => {
    try {
      const response = await fetch(`${API_BASE}/pricing?branch=${encodeURIComponent(selectedBranch)}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ...editValues, branch: selectedBranch }),
      });

      if (response.ok) {
        setPricing(await response.json());
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error saving pricing:", error);
    }
  };

  const handleSaveCake = async () => {
    try {
      const baseUrl = editValues.id?.startsWith("cake-") ? `${API_BASE}/cakes/${editValues.id}` : `${API_BASE}/cakes`;
      const url = `${baseUrl}?branch=${encodeURIComponent(selectedBranch)}`;
      const method = editValues.id?.startsWith("cake-") ? "PUT" : "POST";

      console.log("Saving cake with data:", { ...editValues, branch: selectedBranch });

      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ...editValues, branch: selectedBranch }),
      });

      const data = await response.json();
      console.log("Response status:", response.status, data);

      if (response.ok) {
        await fetchPricing();
        setEditingId(null);
        alert("Cake saved successfully!");
      } else {
        alert(`Error: ${data.error || "Failed to save cake"}`);
      }
    } catch (error) {
      console.error("Error saving cake:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleSaveDecoration = async () => {
    try {
      const baseUrl = editValues.id?.startsWith("extra-") ? `${API_BASE}/decorations/${editValues.id}` : `${API_BASE}/decorations`;
      const url = `${baseUrl}?branch=${encodeURIComponent(selectedBranch)}`;
      const method = editValues.id?.startsWith("extra-") ? "PUT" : "POST";

      console.log("Saving decoration with data:", { ...editValues, branch: selectedBranch });

      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ...editValues, branch: selectedBranch }),
      });

      const data = await response.json();
      console.log("Response status:", response.status, data);

      if (response.ok) {
        await fetchPricing();
        setEditingId(null);
        alert("Decoration saved successfully!");
      } else {
        alert(`Error: ${data.error || "Failed to save decoration"}`);
      }
    } catch (error) {
      console.error("Error saving decoration:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleSaveDecorationPrice = async () => {
    try {
      const response = await fetch(`${API_BASE}/decoration-price?branch=${encodeURIComponent(selectedBranch)}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ price: decorationPrice, branch: selectedBranch }),
      });

      if (response.ok) {
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error saving decoration price:", error);
    }
  };

  const handleDeleteCake = async (id: string) => {
    if (confirm("Are you sure you want to delete this cake?")) {
      try {
        const response = await fetch(`${API_BASE}/cakes/${id}?branch=${encodeURIComponent(selectedBranch)}`, { 
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          await fetchPricing();
        }
      } catch (error) {
        console.error("Error deleting cake:", error);
      }
    }
  };

  const handleDeleteDecoration = async (id: string) => {
    if (confirm("Are you sure you want to delete this decoration?")) {
      try {
        const response = await fetch(`${API_BASE}/decorations/${id}?branch=${encodeURIComponent(selectedBranch)}`, { 
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          await fetchPricing();
        }
      } catch (error) {
        console.error("Error deleting decoration:", error);
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl italic text-primary">Pricing Management</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              {BRANCHES.find((b) => b.id === selectedBranch)?.name}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value as "branch-1" | "branch-2")}
              className="rounded-full border border-border bg-muted px-4 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
            >
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setIsLoggedIn(false);
                setPassword("");
                setToken(null);
              }}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-medium transition-all font-body hover:border-primary/50"
            >
              <LogIn className="h-3 w-3" />
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          {(["services", "cakes", "decorations"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Services Tab */}
        {activeTab === "services" && (
          <div className="space-y-4">
            {Object.entries(pricing).map(([service, durations]) => (
              <div key={service} className="border border-border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4 capitalize">{service.replace("-", " ")}</h3>
                <div className="space-y-3">
                  {Object.entries(durations).map(([duration, price]) => {
                    const isEditing = editingId === `${service}-${duration}`;
                    return (
                      <div key={`${service}-${duration}`} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <span className="font-medium">{duration} Hour{duration !== "1" ? "s" : ""}</span>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <span>₹</span>
                            <input
                            type="number"
                            value={editValues.price}
                            onChange={(e) =>
                           setEditValues({ ...editValues, price: Number(e.target.value) })
                             }
                            className="w-24 px-2 py-1 border border-primary rounded bg-card text-foreground placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <Button
                              size="sm"
                              onClick={handleSaveService}
                              className="bg-primary text-primary-foreground"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">₹{price}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditService(service, Number(duration), price)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cakes Tab */}
        {activeTab === "cakes" && (
          <div className="space-y-4">
            {cakes.map((cake) => {
              const isEditing = editingId === cake.id;
              return (
                <div key={cake.id} className="border border-border rounded-lg p-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Cake name"
                        value={editValues.name || ""}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="w-full px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={editValues.description || ""}
                        onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                        className="w-full px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex gap-2">
                          <span>₹</span>
                          <input
                            type="number"
                            placeholder="Regular Price"
                            value={editValues.price}
                            onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                            className="flex-1 px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="flex gap-2">
                          <span>₹</span>
                          <input
                            type="number"
                            placeholder="Original Price"
                            value={editValues.originalPrice || ""}
                            onChange={(e) => setEditValues({ ...editValues, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                            className="flex-1 px-3 py-2 border border-border rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="flex gap-2">
                          <span>₹</span>
                          <input
                            type="number"
                            placeholder="Offer Price"
                            value={editValues.offerPrice || ""}
                            onChange={(e) => setEditValues({ ...editValues, offerPrice: e.target.value ? Number(e.target.value) : undefined })}
                            className="flex-1 px-3 py-2 border border-border rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary text-green-500"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>💡 For Anniversary with offer: Set Original Price and Offer Price</p>
                        <p>Regular Price will be used as fallback if no offer is set</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveCake} className="bg-primary text-primary-foreground">
                          <Save className="h-4 w-4 mr-2" /> Save
                        </Button>
                        <Button variant="outline" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4 mr-2" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{cake.name}</h4>
                        <p className="text-sm text-muted-foreground">{cake.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {cake.offerPrice !== undefined && cake.offerPrice !== null ? (
                            <>
                              <p className="font-bold text-green-500">₹{cake.offerPrice}</p>
                              <p className="text-sm line-through text-muted-foreground">₹{cake.originalPrice || cake.price}</p>
                            </>
                          ) : (
                            <p className="font-bold text-primary">₹{cake.price}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCake(cake)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCake(cake.id || "")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <Button
              onClick={() => {
                setEditingId("new-cake");
                setEditValues({ name: "", price: 0, description: "" });
              }}
              className="w-full bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" /> Add New Cake
            </Button>
            {editingId === "new-cake" && (
              <div className="border border-border rounded-lg p-6 space-y-4">
                <input
                  type="text"
                  placeholder="Cake name"
                  value={editValues.name || ""}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  className="w-full px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={editValues.description || ""}
                  onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                  className="w-full px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex gap-2">
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="Regular Price"
                      value={editValues.price}
                      onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                      className="flex-1 px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="Original Price"
                      value={editValues.originalPrice || ""}
                      onChange={(e) => setEditValues({ ...editValues, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="flex-1 px-3 py-2 border border-border rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="Offer Price"
                      value={editValues.offerPrice || ""}
                      onChange={(e) => setEditValues({ ...editValues, offerPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="flex-1 px-3 py-2 border border-border rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary text-green-500"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>💡 For Anniversary with offer: Set Original Price and Offer Price</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveCake} className="bg-primary text-primary-foreground">
                    <Save className="h-4 w-4 mr-2" /> Create
                  </Button>
                  <Button variant="outline" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Decorations Tab */}
        {activeTab === "decorations" && (
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">Base Decoration Price</h3>
              {editingId === "decoration-price" ? (
                <div className="flex gap-2">
                  <span>₹</span>
                  <input
                    type="number"
                    value={decorationPrice}
                    onChange={(e) => setDecorationPrice(Number(e.target.value))}
                    className="flex-1 px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button onClick={handleSaveDecorationPrice} className="bg-primary text-primary-foreground">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary text-lg">₹{decorationPrice}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId("decoration-price")}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {decorations.map((decoration) => {
              const isEditing = editingId === decoration.id;
              return (
                <div key={decoration.id} className="border border-border rounded-lg p-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Decoration name"
                        value={editValues.name || ""}
                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        className="w-full px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        value={editValues.description || ""}
                        onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                        className="w-full px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex gap-2">
                          <span>₹</span>
                          <input
                            type="number"
                            placeholder="Regular Price"
                            value={editValues.price}
                            onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                            className="flex-1 px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="flex gap-2">
                          <span>₹</span>
                          <input
                            type="number"
                            placeholder="Original Price"
                            value={editValues.originalPrice || ""}
                            onChange={(e) => setEditValues({ ...editValues, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                            className="flex-1 px-3 py-2 border border-border rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="flex gap-2">
                          <span>₹</span>
                          <input
                            type="number"
                            placeholder="Offer Price"
                            value={editValues.offerPrice || ""}
                            onChange={(e) => setEditValues({ ...editValues, offerPrice: e.target.value ? Number(e.target.value) : undefined })}
                            className="flex-1 px-3 py-2 border border-border rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary text-green-500"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>💡 For Anniversary with offer: Set Original Price and Offer Price</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveDecoration} className="bg-primary text-primary-foreground">
                          <Save className="h-4 w-4 mr-2" /> Save
                        </Button>
                        <Button variant="outline" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4 mr-2" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{decoration.name}</h4>
                        <p className="text-sm text-muted-foreground">{decoration.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {decoration.offerPrice !== undefined && decoration.offerPrice !== null ? (
                            <>
                              <p className="font-bold text-green-500">₹{decoration.offerPrice}</p>
                              <p className="text-sm line-through text-muted-foreground">₹{decoration.originalPrice || decoration.price}</p>
                            </>
                          ) : (
                            <p className="font-bold text-primary">₹{decoration.price}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditDecoration(decoration)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDecoration(decoration.id || "")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <Button
              onClick={() => {
                setEditingId("new-decoration");
                setEditValues({ name: "", price: 0, description: "" });
              }}
              className="w-full bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" /> Add New Decoration
            </Button>
            {editingId === "new-decoration" && (
              <div className="border border-border rounded-lg p-6 space-y-4">
                <input
                  type="text"
                  placeholder="Decoration name"
                  value={editValues.name || ""}
                  onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                  className="w-full px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={editValues.description || ""}
                  onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                  className="w-full px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex gap-2">
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="Regular Price"
                      value={editValues.price}
                      onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                      className="flex-1 px-3 py-2 border border-primary rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="Original Price"
                      value={editValues.originalPrice || ""}
                      onChange={(e) => setEditValues({ ...editValues, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="flex-1 px-3 py-2 border border-border rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="Offer Price"
                      value={editValues.offerPrice || ""}
                      onChange={(e) => setEditValues({ ...editValues, offerPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="flex-1 px-3 py-2 border border-border rounded text-foreground bg-card placeholder:text-muted-foreground caret-foreground focus:outline-none focus:ring-2 focus:ring-primary text-green-500"
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>💡 For Anniversary with offer: Set Original Price and Offer Price</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveDecoration} className="bg-primary text-primary-foreground">
                    <Save className="h-4 w-4 mr-2" /> Create
                  </Button>
                  <Button variant="outline" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPricing;
