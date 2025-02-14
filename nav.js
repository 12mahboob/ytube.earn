  // Fetch the nav.html content and insert it into the #nav-placeholder div
  fetch('nav.html')
  .then(response => response.text())  // Convert the response to text
  .then(data => {
      document.getElementById('nav-placeholder').innerHTML = data;
  })
  .catch(error => {
      console.error('Error loading the navigation:', error);
  });