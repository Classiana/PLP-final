document.getElementById('test-db').addEventListener('click', () => {
    fetch('/invoices/test')
        .then(res => res.json())
        .then(data => {
            document.getElementById('db-result').innerText = JSON.stringify(data);
        })
        .catch(err => {
            document.getElementById('db-result').innerText = 'Error connecting to DB';
            console.error(err);
        });
});

