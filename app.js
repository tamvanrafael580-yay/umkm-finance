// UMKM Finance. Firebase config is added in firebase-config.js.
// If Firebase is not configured, the app runs in demo mode using this browser's localStorage.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const LOCAL_KEY = "umkm-finance-transactions-v1";
const categories = {
  Pemasukan: ["Penjualan", "Pendapatan Jasa", "Penerimaan Piutang", "Setoran Modal", "Pendapatan Lain-lain"],
  Pengeluaran: ["Pembelian Bahan Baku", "Pembelian Barang Dagangan", "Kemasan", "Gaji Karyawan", "Listrik", "Air", "Sewa Tempat", "Transportasi", "Perlengkapan", "Pembayaran Utang", "Pembelian Aset", "Prive", "Biaya Operasional Lainnya"]
};
let db = null, online = false, transactions = [];

function hasFirebaseConfig(c) {
  return c && c.apiKey && c.apiKey !== "GANTI_DENGAN_API_KEY" && c.projectId && c.projectId !== "GANTI_DENGAN_PROJECT_ID";
}
try {
  if (hasFirebaseConfig(firebaseConfig)) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app); online = true;
  }
} catch (e) { console.warn("Firebase belum siap; menggunakan mode lokal.", e); }
$("connectionDot").style.background = online ? "#6be0a4" : "#ffd166";
$("connectionText").textContent = online ? "Database online" : "Mode demo lokal";

function rupiah(n) { return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0); }
function localDate(d=new Date()) { const z=new Date(d.getTime()-d.getTimezoneOffset()*60000); return z.toISOString().slice(0,10); }
$("date").value = localDate();
function refreshCategories() {
  const list = categories[$("type").value] || [];
  $("category").innerHTML = list.map(x=>`<option>${x}</option>`).join("");
}
$("type").addEventListener("change",refreshCategories); refreshCategories();

async function loadTransactions() {
  try {
    if (online) {
      const snap = await getDocs(query(collection(db,"transactions"),orderBy("date","desc")));
      transactions = snap.docs.map(d=>({id:d.id,...d.data()}));
    } else {
      transactions = JSON.parse(localStorage.getItem(LOCAL_KEY)||"[]");
    }
    render();
  } catch (e) {
    $("formMessage").textContent = "Gagal membaca database. Periksa konfigurasi dan aturan keamanan Firebase.";
    $("formMessage").className = "error";
    console.error(e);
  }
}
async function saveTransaction(item) {
  if (online) {
    const ref = await addDoc(collection(db,"transactions"),item);
    return {...item,id:ref.id};
  }
  const record = {...item,id:crypto.randomUUID()};
  transactions.unshift(record);
  localStorage.setItem(LOCAL_KEY,JSON.stringify(transactions));
  return record;
}
async function removeTransaction(id) {
  if (!confirm("Hapus transaksi ini? Tindakan ini tidak dapat dibatalkan.")) return;
  try {
    if (online) await deleteDoc(doc(db,"transactions",id));
    transactions = transactions.filter(t=>t.id!==id);
    if (!online) localStorage.setItem(LOCAL_KEY,JSON.stringify(transactions));
    render();
  } catch(e) { alert("Transaksi gagal dihapus. Periksa koneksi/database."); }
}
$("transactionForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const amount = Number($("amount").value);
  if (!Number.isFinite(amount)||amount<=0) { showMessage("Nominal harus lebih besar dari nol.",true); return; }
  const item = {
    date:$("date").value, business:$("business").value, type:$("type").value,
    category:$("category").value, description:$("description").value.trim(),
    amount, method:$("method").value, notes:$("notes").value.trim(),
    createdAt:new Date().toISOString()
  };
  if (!item.date || !item.description) { showMessage("Lengkapi semua kolom wajib.",true); return; }
  try {
    const saved = await saveTransaction(item);
    if (online) transactions.unshift(saved);
    $("transactionForm").reset(); $("date").value=localDate(); refreshCategories();
    showMessage("Transaksi berhasil disimpan.");
    await loadTransactions();
  } catch(err) { console.error(err); showMessage("Gagal menyimpan transaksi. Periksa koneksi atau konfigurasi Firebase.",true); }
});
function showMessage(msg,error=false){$("formMessage").textContent=msg;$("formMessage").className=error?"error":"";}
function filtered() {
  const b=$("businessFilter").value,m=$("monthFilter").value;
  return transactions.filter(t=>(b==="Semua"||t.business===b)&&(m==="Semua"||String(t.date||"").slice(0,7)===m));
}
function render() {
  const data=filtered();
  const inc=data.filter(t=>t.type==="Pemasukan").reduce((s,t)=>s+Number(t.amount||0),0);
  const out=data.filter(t=>t.type==="Pengeluaran").reduce((s,t)=>s+Number(t.amount||0),0);
  $("totalIn").textContent=rupiah(inc); $("totalOut").textContent=rupiah(out);
  $("netCash").textContent=rupiah(inc-out); $("netCash").className=(inc-out)<0?"negative":"";
  $("transactionCount").textContent=data.length.toLocaleString("id-ID");
  const rows=$("transactionRows");
  if(!data.length){rows.innerHTML='<tr><td colspan="8" class="empty">Belum ada transaksi untuk filter ini.</td></tr>';}
  else rows.innerHTML=data.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(t=>`<tr>
    <td>${escapeHtml(t.date||"")}</td><td>${escapeHtml(t.business||"")}</td>
    <td><span class="${t.type==="Pemasukan"?"positive":"negative"}">${escapeHtml(t.type||"")}</span></td>
    <td>${escapeHtml(t.category||"")}</td><td title="${escapeHtml(t.notes||"")}">${escapeHtml(t.description||"")}</td>
    <td>${escapeHtml(t.method||"")}</td><td class="right ${t.type==="Pemasukan"?"positive":"negative"}">${rupiah(t.amount)}</td>
    <td><button class="delete" data-delete="${escapeHtml(t.id)}">Hapus</button></td></tr>`).join("");
  rows.querySelectorAll("[data-delete]").forEach(btn=>btn.addEventListener("click",()=>removeTransaction(btn.dataset.delete)));
  const months = $("monthFilter").value==="Semua" ? ["2026-09","2026-10","2026-11"] : [$("monthFilter").value];
  $("monthlyRows").innerHTML=months.map(m=>{
    const a=data.filter(t=>(t.date||"").slice(0,7)===m);
    const i=a.filter(t=>t.type==="Pemasukan").reduce((s,t)=>s+Number(t.amount||0),0);
    const o=a.filter(t=>t.type==="Pengeluaran").reduce((s,t)=>s+Number(t.amount||0),0);
    const label={"2026-09":"September 2026","2026-10":"Oktober 2026","2026-11":"November 2026"}[m]||m;
    return `<tr><td>${label}</td><td class="right positive">${rupiah(i)}</td><td class="right negative">${rupiah(o)}</td><td class="right ${(i-o)<0?"negative":"positive"}">${rupiah(i-o)}</td></tr>`;
  }).join("");
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("businessFilter").addEventListener("change",render); $("monthFilter").addEventListener("change",render); $("refreshBtn").addEventListener("click",loadTransactions);
$("exportBtn").addEventListener("click",()=>{
  const data=filtered(); const headers=["Tanggal","Jenis UMKM","Jenis Transaksi","Kategori","Keterangan","Nominal","Metode Pembayaran","Catatan"];
  const lines=[headers,...data.map(t=>[t.date,t.business,t.type,t.category,t.description,t.amount,t.method,t.notes])];
  const csv="\uFEFF"+lines.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}); const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="transaksi-umkm.csv";a.click();URL.revokeObjectURL(url);
});
loadTransactions();