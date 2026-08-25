"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { Branch, Product } from "../shared";
import { useBranch } from "../context/BranchContext";

export default function EmpresaInventarioPage() {
  const { selectedBranch } = useBranch();
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formLocalId, setFormLocalId] = useState<number | null>(null);
  const [formIgv, setFormIgv] = useState(false);
  const [adding, setAdding] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [customCategoryMode, setCustomCategoryMode] = useState(false);

  // Estados para importar CSV de productos
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);

  useEffect(() => {
    apiFetch<Branch[]>("/branches/me")
      .then(bList => {
        const list = Array.isArray(bList) ? bList : [];
        setBranches(list);
        if (list.length > 0 && !selectedBranch) {
          setFormLocalId(prev => (prev === null ? list[0].id : prev));
        }
      })
      .catch(() => setBranches([]));
  }, [selectedBranch]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const query = selectedBranch ? `?localId=${selectedBranch.id}` : "";
        const productData = await apiFetch<Product[]>(`/products/my${query}`);
        setProducts(Array.isArray(productData) ? productData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar inventario");
      } finally {
        setLoading(false);
      }
    };
    loadData();

    if (selectedBranch) {
      setFormLocalId(selectedBranch.id);
    } else if (branches.length > 0) {
      setFormLocalId(branches[0].id);
    }
  }, [selectedBranch, branches]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormCategory("");
    setFormBrand("");
    setFormPrice("");
    setFormStock("");
    setFormIgv(false);
    setFormLocalId(selectedBranch?.id ?? (branches[0]?.id ?? null));
    setPhoto(null);
    setPhotoPreview(null);
    setShowProductForm(false);
    setEditingId(null);
    setCustomCategoryMode(false);
    setError(null);
  };

  const downloadProductTemplate = () => {
    const csvContent = "Nombre;Descripcion;Precio;Stock;Categoria;Marca;Proveedor;IGV\nFiltro de Aceite;Filtro para motor Hyundai/Kia;35.50;20;Filtros;Hyundai;Autopartes SAC;si\nPastillas de freno;Pastillas delanteras ceramicas;120.00;10;Frenos;Brembo;Importadora Alfa;no\nBateria 11 placas;Bateria libre mantenimiento 12V;380.00;5;Baterias;Bosch;Bosch Peru;si";
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_productos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length === 0) return;

      const header = lines[0];
      const separator = header.includes(";") ? ";" : ",";
      const headers = header.split(separator).map(h => h.trim().toLowerCase().replace(/['"“”]/g, ""));

      const targetLocalId = selectedBranch
        ? selectedBranch.id
        : (formLocalId ?? (branches[0]?.id ?? null));

      const items: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(separator).map(v => {
          let cleaned = v.trim();
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
          }
          return cleaned;
        });

        const rowObj: any = {};
        headers.forEach((h, index) => {
          rowObj[h] = values[index] || "";
        });

        const name = rowObj.nombre || rowObj.name || "";
        const description = rowObj.descripcion || rowObj.description || rowObj.descripción || "";
        const price = Number(rowObj.precio || rowObj.price || 0);
        const stock = Number(rowObj.stock || 0);
        const category = rowObj.categoria || rowObj.category || rowObj.categoría || "";
        const brand = rowObj.marca || rowObj.brand || "";
        const supplier = rowObj.proveedor || rowObj.supplier || "";
        const igvStr = (rowObj.igv || "").toLowerCase();
        const igv = igvStr === "si" || igvStr === "sí" || igvStr === "true" || igvStr === "1";

        if (name) {
          items.push({ name, description, price, stock, category, brand, supplier, igv, localId: targetLocalId });
        }
      }
      setParsedItems(items);
    };
    reader.readAsText(file, "UTF-8");
  };

  const confirmImportProducts = async () => {
    if (parsedItems.length === 0) return;
    try {
      setImporting(true);
      setError(null);
      const imported = await apiFetch<Product[]>("/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedItems),
      });
      setProducts(prev => [...prev, ...(Array.isArray(imported) ? imported : [])]);
      setShowImport(false);
      setParsedItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar productos");
    } finally {
      setImporting(false);
    }
  };

  const openForm = () => {
    resetForm();
    setShowProductForm(true);
  };

  const openEdit = (p: Product) => {
    setFormName(p.name || "");
    setFormCategory(p.category || "");
    setFormBrand(p.brand || "");
    setFormPrice(p.price?.toString() || "");
    setFormStock(p.stock?.toString() || "");
    setFormIgv(p.igv || false);
    setFormLocalId(selectedBranch ? selectedBranch.id : (p.localId ?? (branches[0]?.id ?? null)));
    setPhotoPreview(p.photoUrl || null);
    setPhoto(null);
    setEditingId(p.id);
    const isPredefined = ["aceites", "frenos", "baterías", "neumáticos", "filtros"].includes(p.category?.toLowerCase() || "");
    setCustomCategoryMode(!isPredefined && !!p.category);
    setShowProductForm(true);
    setError(null);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAdding(true);
      setError(null);

      const targetLocalId = selectedBranch
        ? selectedBranch.id
        : (formLocalId ?? (branches[0]?.id ?? null));

      const payload = {
        name: formName,
        category: formCategory,
        brand: formBrand,
        price: parseFloat(formPrice),
        stock: parseInt(formStock, 10),
        igv: formIgv,
        localId: targetLocalId,
      };

      let savedProduct;

      if (editingId) {
        // Actualizar
        savedProduct = await apiFetch<Product>(`/products/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Crear
        savedProduct = await apiFetch<Product>("/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      // Subir foto si interactuó (nueva foto elegida)
      if (photo) {
        const formData = new FormData();
        formData.append("file", photo);
        savedProduct = await apiFetch<Product>(`/products/${savedProduct.id}/photo`, {
          method: "PUT",
          body: formData,
        });
      }

      setProducts(prev => {
        if (editingId) {
          return prev.map(p => p.id === editingId ? savedProduct : p);
        }
        return [...prev, savedProduct];
      });

      resetForm();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar producto");
    } finally {
      setAdding(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("¿Eliminar este producto del inventario?")) return;
    try {
      await apiFetch(`/products/${id}`, { method: "DELETE" });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      setError("No se pudo eliminar el producto");
    }
  };

  const lowStock = products.filter(p => (p.stock ?? 0) <= 5);

  return (
    <>
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventario</h1>
          <p className="mt-0.5 text-sm text-slate-500">Stock de repuestos y alertas</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => { setParsedItems([]); setShowImport(prev => !prev); setShowProductForm(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            Importar CSV
          </button>
          <button type="button" onClick={showProductForm ? resetForm : () => { openForm(); setShowImport(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
            Nuevo Producto
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="space-y-6">
        {showImport && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Importar Productos</h3>
            <p className="text-xs text-slate-500 mb-4">
              Sube un archivo en formato <strong>CSV</strong> (delimitado por comas <code>,</code> o punto y coma <code>;</code>).
              Las columnas deben ser: <code>Nombre</code>, <code>Descripcion</code>, <code>Precio</code>, <code>Stock</code>, <code>Categoria</code>, <code>Marca</code>, <code>Proveedor</code>, <code>IGV</code>.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button type="button" onClick={downloadProductTemplate}
                className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/80 px-3 py-2 rounded-lg transition">
                Descargar plantilla CSV
              </button>
              <input type="file" accept=".csv" onChange={handleCSVUpload}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
            </div>
            {parsedItems.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-green-600 mb-2">✓ Se detectaron {parsedItems.length} productos listos para importar.</p>
                <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50 text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-1 font-semibold">Nombre</th>
                        <th className="pb-1 font-semibold">Precio</th>
                        <th className="pb-1 font-semibold">Stock</th>
                        <th className="pb-1 font-semibold">Categoría</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedItems.map((item: any, idx: number) => (
                        <tr key={idx} className="text-slate-700">
                          <td className="py-1 max-w-[200px] truncate">{item.name}</td>
                          <td className="py-1">S/ {item.price}</td>
                          <td className="py-1">{item.stock} uds</td>
                          <td className="py-1">{item.category || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={confirmImportProducts} disabled={parsedItems.length === 0 || importing}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-60 transition">
                {importing ? "Importando..." : "Confirmar Importación"}
              </button>
              <button type="button" onClick={() => { setShowImport(false); setParsedItems([]); }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition">
                Cancelar
              </button>
            </div>
          </div>
        )}
        {showProductForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={resetForm} />

            <div className="relative bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl z-10 border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                    📦
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {editingId ? "Editar Repuesto / Producto" : "Registrar Nuevo Producto"}
                    </h2>
                    <p className="text-xs text-slate-500">Gestiona la información de inventario de tu negocio</p>
                  </div>
                </div>
                <button type="button" onClick={resetForm} className="h-9 w-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition font-bold text-sm">
                  ✕
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              )}

              <form onSubmit={handleSaveProduct} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Nombre del Producto</label>
                    <input required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ej: Neumático Michelin 205/55R16"
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Categoría</label>
                    {customCategoryMode ? (
                      <div className="relative">
                        <input
                          required
                          value={formCategory}
                          onChange={e => setFormCategory(e.target.value)}
                          placeholder="Ej: Bujías, Suspensión"
                          className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormCategory("");
                            setCustomCategoryMode(false);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-sm"
                          title="Volver a la lista"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <select
                        required
                        value={formCategory}
                        onChange={e => {
                          if (e.target.value === "OTRO") {
                            setFormCategory("");
                            setCustomCategoryMode(true);
                          } else {
                            setFormCategory(e.target.value);
                          }
                        }}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="aceites">Aceites</option>
                        <option value="frenos">Frenos</option>
                        <option value="baterías">Baterías</option>
                        <option value="neumáticos">Neumáticos</option>
                        <option value="filtros">Filtros</option>
                        <option value="OTRO">Otro (Escribir...)</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Marca</label>
                    <input value={formBrand} onChange={e => setFormBrand(e.target.value)} placeholder="Michelin"
                      className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Sede del Producto</label>
                    {selectedBranch ? (
                      <div className="w-full h-11 rounded-xl border border-slate-200 bg-slate-100 px-4 flex items-center text-sm font-semibold text-slate-700 truncate">
                        {selectedBranch.name}
                      </div>
                    ) : (
                      <select
                        value={formLocalId ?? (branches[0]?.id ?? "")}
                        onChange={e => setFormLocalId(Number(e.target.value))}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Precio (S/)</label>
                      <input required type="number" step="0.01" min="0" value={formPrice} onChange={e => setFormPrice(e.target.value)} placeholder="0.00"
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Stock Inicial</label>
                      <input required type="number" min="0" value={formStock} onChange={e => setFormStock(e.target.value)} placeholder="10"
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Imagen Referencial</label>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                        )}
                      </div>
                      <label className="flex-1">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        <div className="h-11 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 hover:border-blue-200 cursor-pointer transition-all">
                          {photo ? "Imagen cargada" : "Seleccionar archivo"}
                        </div>
                      </label>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-2 pl-1">
                      <input type="checkbox" checked={formIgv} onChange={e => setFormIgv(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500/20 border-slate-300" />
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Aplica IGV (18%)</span>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button type="submit" disabled={adding}
                      className="w-full h-11 rounded-xl bg-blue-600 text-white text-sm font-black uppercase tracking-widest hover:bg-blue-500 transition shadow-lg shadow-blue-600/20 disabled:opacity-60">
                      {adding ? "Guardando..." : (editingId ? "Actualizar Producto" : "Registrar Producto")}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {lowStock.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex items-start gap-4">
              <div className="h-10 w-10 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
              </div>
              <div className="flex-1">
                <div className="text-rose-800 font-bold text-sm mb-1">{lowStock.length} productos con stock crítico (≤5)</div>
                <div className="flex flex-wrap gap-2">
                  {lowStock.map(p => (
                    <span key={p.id} className="text-[10px] font-black uppercase tracking-wide bg-white/50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200/50">
                      {p.name} ({p.stock})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Producto</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría / Marca</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Sede</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Precio Unit.</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Existencias</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Estado</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 px-2">
                  {loading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-sm text-slate-400 text-center">Analizando inventario...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-sm text-slate-400 text-center">No hay productos registrados en tu inventario.</td></tr>
                  ) : products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.name ?? "Producto"} className="w-full h-full object-cover" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300"><path d="m21 8-9-4-9 4" /><path d="m21 16-9 4-9-4" /><path d="m3 8 9 4 9-4" /><path d="M12 12v8" /></svg>
                            )}
                          </div>
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{p.category ?? "SIN CAT."}</span>
                        <span className="text-xs font-semibold text-slate-600">{p.brand ?? "Genérico"}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                          {branches.find(b => b.id === p.localId)?.name ?? "Sede Principal"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900">S/ {(p.price ?? 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-black ${(p.stock ?? 0) <= 5 ? "text-rose-600" : "text-slate-900"}`}>
                            {p.stock}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">u.</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border ${(p.stock ?? 0) <= 5
                          ? "bg-rose-50 text-rose-700 border-rose-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                          }`}>
                          {(p.stock ?? 0) <= 5 ? "Stock Bajo" : "Disponible"}
                        </span>
                        {p.igv && (
                          <span className="block mt-1 text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50/50 rounded inline-block px-1.5 border border-blue-100">
                            +IGV
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => openEdit(p)} title="Editar producto"
                            className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-transparent text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                          </button>
                          <button type="button" onClick={() => deleteProduct(p.id)} title="Eliminar producto"
                            className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-transparent text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
