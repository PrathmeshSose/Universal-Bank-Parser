import "../styles/Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        🏦 Universal Bank Parser
      </div>

      <ul className="nav-links">
        <li><a href="/" style={{ color: 'white', textDecoration: 'none' }}>Home</a></li>
        <li><a href="#upload" style={{ color: 'white', textDecoration: 'none' }}>Upload</a></li>
        <li><a href="#transactions" style={{ color: 'white', textDecoration: 'none' }}>Transactions</a></li>
        <li><a href="#export" style={{ color: 'white', textDecoration: 'none' }}>Export</a></li>
      </ul>
    </nav>
  );
}

export default Navbar;