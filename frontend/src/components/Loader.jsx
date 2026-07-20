import "../styles/Loader.css";

function Loader() {
  return (
    <div className="loader-container">
      <div className="spinner"></div>

      <h3>Processing PDF...</h3>

      <p>Please wait while the bank statement is being processed.</p>
    </div>
  );
}

export default Loader;