const K = "overtime_manager";
let S = JSON.parse(localStorage.getItem(K) || "null") || {
  units: [
    { id: "u1", name: "پشتیبانی سخت افزار" },
    { id: "u2", name: "شبکه" },
    { id: "u3", name: "دیتابیس" },
  ],
  people: [
    { code: "11111", name: " کاربر 1", unit: "u1" },
    { code: "22222", name: " کاربر 2", unit: "u1" },
    { code: "33333", name: " کاربر 3", unit: "u1" }

  ],
  ot: [],
  cycles: {},
};
const T = { 1: "شنبه تا چهارشنبه", 2: "پنجشنبه و جمعه", 3: "خارج از سهمیه" };
let cv = { y: 1405, m: 1 },
  target = null;
function save() {
  localStorage.setItem(K, JSON.stringify(S));
  render();
}
function fa(x) {
  return String(x ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}
function pad(x) {
  return String(x).padStart(2, "0");
}
function jtod(y, m, d) {
  let a = y - 979,
    days =
      365 * a +
      Math.floor(a / 33) * 8 +
      Math.floor(((a % 33) + 3) / 4) +
      d +
      (m < 7 ? (m - 1) * 31 : (m - 1) * 30 + 6) -
      1;
  let gy = 1600 + 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days >= 36525) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days >= 366) {
    days--;
    gy += Math.floor(days / 365);
    days %= 365;
  }
  let md = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
  if (leap) md[1] = 29;
  let gm = 0;
  while (days >= md[gm]) days -= md[gm++];
  return new Date(gy, gm, days + 1);
}
function dtj(d) {
  let gy = d.getFullYear(),
    gm = d.getMonth() + 1,
    gd = d.getDate(),
    g = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
    days =
      355666 +
      365 * gy +
      Math.floor((gy + 1) / 4) -
      Math.floor((gy + 1) / 100) +
      Math.floor((gy + 1) / 400) +
      gd +
      g[gm - 1];
  if (gm > 2 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) days++;
  let jy = -1597 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  return {
    y: jy,
    m:
      days < 186
        ? 1 + Math.floor(days / 31)
        : 7 + Math.floor((days - 186) / 30),
    d: 1 + (days < 186 ? days % 31 : (days - 186) % 30),
  };
}
function today() {
  let j = dtj(new Date());
  return `${j.y}/${pad(j.m)}/${pad(j.d)}`;
}
function uname(id) {
  return S.units.find((u) => u.id === id)?.name || id;
}
function people() {
  return S.people.filter((p) => p.unit === unit.value);
}
function cycle() {
  return S.cycles[unit.value] || 1;
}
function used(p) {
  return S.ot.some(
    (o) =>
      o.type == 1 &&
      o.unit === unit.value &&
      o.code === p.code &&
      o.cycle === cycle(),
  );
}
function render() {
  unit.innerHTML = S.units
    .map((u) => `<option value="${u.id}">${u.name}</option>`)
    .join("");
  ru.innerHTML = '<option value="">همه</option>' + unit.innerHTML;
  let ps = people(),
    q = fa(search.value).toLowerCase();
  let u = 0;
  peopleBox.innerHTML =
    ps
      .filter(
        (p) => !q || p.code.includes(q) || p.name.toLowerCase().includes(q),
      )
      .map((p) => {
        let z = type.value == 1 && used(p);
        if (z) u++;
        return `<label class="person ${z ? "used" : ""}"><input type="checkbox" value="${p.code}" ${z ? "disabled" : ""}><div><b>${p.name}</b><div class="code">${p.code}</div><div class="unit">${uname(p.unit)}</div></div></label>`;
      })
      .join("") || '<div class="info">موردی پیدا نشد.</div>';
  info.innerHTML =
    type.value == 3
      ? "خارج از سهمیه: محدودیت چرخه ندارد."
      : type.value == 2
        ? "پنجشنبه و جمعه: محدودیت چرخه اعمال نمی‌شود."
        : `چرخه ${cycle()} | استفاده‌شده ${u} از ${ps.length}`;
  pc.textContent = S.people.length;
  uc.textContent = S.units.length;
  oc.textContent = S.ot.length;
  hc.textContent = S.ot.reduce((a, o) => a + Number(o.hours), 0);
  pb.innerHTML = S.people
    .map(
      (p) =>
        `<tr><td>${p.code}</td><td>${p.name}</td><td>${uname(p.unit)}</td></tr>`,
    )
    .join("");
  report();
}
function report() {
  let f = from.value,
    t = to.value;
  let rows = S.ot.filter(
    (o) =>
      (!f || o.date >= f) &&
      (!t || o.date <= t) &&
      (!ru.value || o.unit === ru.value) &&
      (!rt.value || o.type == rt.value),
  );
  rb.innerHTML =
    rows
      .map(
        (o) =>
          `<tr><td>${o.date}</td><td>${o.code}</td><td>${o.name}</td><td>${uname(o.unit)}</td><td>${T[o.type]}</td><td>${o.hours}</td></tr>`,
      )
      .join("") || "<tr><td colspan=6>رکوردی یافت نشد.</td></tr>";
}
function openCal(el) {
  target = el;
  let v = el.value || today(),
    a = v.split("/").map(Number);
  cv = { y: a[0], m: a[1] };
  draw();
  document.querySelector(".picker").classList.add("open");
}
function draw() {
  let first = jtod(cv.y, cv.m, 1),
    offset = (first.getDay() + 1) % 7,
    last = cv.m <= 6 ? 31 : cv.m <= 11 ? 30 : 30,
    h = `<div class="calhead"><button onclick="mv(-1)">ماه قبل</button><b>${cv.y}/${pad(cv.m)}</b><button onclick="mv(1)">ماه بعد</button></div><div class="week"><span>ی</span><span>د</span><span>س</span><span>چ</span><span>پ</span><span>ج</span><span>ش</span></div><div class="days">`;
  for (let i = 0; i < offset; i++) h += '<button class="day empty">0</button>';
  for (let d = 1; d <= last; d++) {
    let v = `${cv.y}/${pad(cv.m)}/${pad(d)}`;
    h += `<button class="day ${target?.value === v ? "sel" : ""}" onclick="pick('${v}')">${d}</button>`;
  }
  calendar.innerHTML = h + "</div>";
}
function mv(n) {
  cv.m += n;
  if (cv.m > 12) {
    cv.m = 1;
    cv.y++;
  }
  if (cv.m < 1) {
    cv.m = 12;
    cv.y--;
  }
  draw();
}
function pick(v) {
  target.value = v;
  document.querySelector(".picker").classList.remove("open");
  report();
}
function exp(rows, name) {
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "گزارش");
  XLSX.writeFile(wb, name + ".xlsx");
}
document.addEventListener("DOMContentLoaded", () => {
  window.unit = document.querySelector("#unit");
  window.ru = document.querySelector("#ru");
  window.type = document.querySelector("#type");
  window.rt = document.querySelector("#rt");
  window.date = document.querySelector("#date");
  window.search = document.querySelector("#search");
  window.peopleBox = document.querySelector("#people");
  window.info = document.querySelector("#info");
  window.calendar = document.querySelector("#calendar");
  window.from = document.querySelector("#from");
  window.to = document.querySelector("#to");
  window.rb = document.querySelector("#rb");
  window.pb = document.querySelector("#pb");
  unit.onchange = render;
  type.onchange = render;
  search.oninput = render;
  date.value = today();
  [from, to].forEach((x) => (x.onclick = () => openCal(x)));
  date.onclick = () => openCal(date);
  document.querySelector("#calBtn").onclick = () => openCal(date);
  [from, to, ru, rt].forEach((x) => x.addEventListener("input", report));
  document.querySelectorAll("nav button").forEach(
    (b) =>
      (b.onclick = () => {
        document
          .querySelectorAll("nav button,.tab")
          .forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        document.querySelector("#" + b.dataset.t).classList.add("active");
      }),
  );
  document.querySelector("#save").onclick = () => {
    let codes = [...peopleBox.querySelectorAll("input:checked")].map(
      (x) => x.value,
    );
    if (!codes.length) return alert("حداقل یک نفر را انتخاب کنید.");
    codes.forEach((c) => {
      let p = S.people.find((x) => x.code === c);
      S.ot.push({
        date: date.value,
        code: c,
        name: p.name,
        unit: p.unit,
        type: type.value,
        hours: Number(hours.value),
        description: desc.value,
        cycle: type.value == 1 ? cycle() : null,
      });
    });
    if (type.value == 1 && people().length && people().every(used))
      S.cycles[unit.value] = cycle() + 1;
    save();
    alert("اطلاعات ثبت شد.");
  };
  document.querySelector("#file").onchange = (e) => {
    let r = new FileReader();
    r.onload = (x) => {
      let wb = XLSX.read(new Uint8Array(x.target.result), { type: "array" }),
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
          defval: "",
        });
      rows.forEach((r) => {
        let c = fa(r["پرسنلی"] || "").trim(),
          n = String(r["نام و نام خانوادگی"] || "").trim(),
          un = String(r["واحد"] || "").trim();
        if (!c || !n || !un) return;
        let u = S.units.find((x) => x.name === un);
        if (!u) {
          u = { id: "u" + Date.now() + Math.random(), name: un };
          S.units.push(u);
        }
        let p = S.people.find((x) => x.code === c);
        if (p) {
          p.name = n;
          p.unit = u.id;
        } else S.people.push({ code: c, name: n, unit: u.id });
      });
      save();
      alert("ورود Excel انجام شد.");
    };
    r.readAsArrayBuffer(e.target.files[0]);
  };
  document.querySelector("#exportReport").onclick = () => {
    let rows = S.ot.map((o) => ({
      تاریخ: o.date,
      پرسنلی: o.code,
      "نام و نام خانوادگی": o.name,
      واحد: uname(o.unit),
      نوع: T[o.type],
      ساعت: o.hours,
    }));
    exp(rows, "گزارش_اضافه_کاری");
  };
  render();
});
