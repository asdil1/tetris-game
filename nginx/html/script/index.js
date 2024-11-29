function store() {
    const username = document.getElementById("username").value;
    localStorage.setItem("tetris.username", username);
}