document.getElementById("testForm2").addEventListener("submit", (e) => {
  e.preventDefault();
  const stock = e.target[0].value;
  const checkbox = e.target[1].checked;
  fetch(`/api/stock-prices/?stock1=${stock}&like=${checkbox}`).then((res) =>
    res.json()
  );
});

document.getElementById("testForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const stock1 = e.target[0].value;
  const stock2 = e.target[1].value;
  const checkbox = e.target[2].checked;
  fetch(
    `/api/stock-prices?stock1=${stock1}&stock2=${stock2}&like=${checkbox}`
  ).then((res) => res.json());
});
