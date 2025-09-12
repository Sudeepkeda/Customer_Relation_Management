// Highlight active nav link
const currentPage = window.location.pathname.split("/").pop().toLowerCase();
const navLinks = document.querySelectorAll('.nav-list .nav-link');

navLinks.forEach(link => {
  const linkPage = link.getAttribute('href').toLowerCase();
  if (linkPage === currentPage) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});
