const tg = window.Telegram.WebApp;

function registerForRaffle() {
    alert("Функция регистрации в разработке!");
}

function viewProfile() {
    alert("Ваш ID: " + tg.initDataUnsafe.user.id);
}

function changeAddress() {
    const newAddress = prompt("Введите новый TON-адрес:");
    if (newAddress) {
        alert("TON-адрес успешно обновлен!");
    }
}