let accounts = [];
let currentAccount = null;

// Función para crear una nueva cuenta
function createNewAccount(accountNumber, pin, balance) {
    // Crear objeto de nueva cuenta
    const newAccount = {
        accountNumber: accountNumber,
        pin: pin,
        balance: parseFloat(balance),
    };

    // Guardar la nueva cuenta en localStorage
    let accounts = JSON.parse(localStorage.getItem('cuentas')) || [];
    accounts.push(newAccount);
    localStorage.setItem('cuentas', JSON.stringify(accounts));

    Swal.fire('Cuenta Creada', `La cuenta con número ${accountNumber} ha sido creada exitosamente.`, 'success');
}

// Evento para abrir un formulario de SweetAlert2 y crear la cuenta
document.getElementById('create-account-btn').addEventListener('click', () => {
    Swal.fire({
        title: 'Crear Nueva Cuenta',
        html:
            `<input id="swal-account-number" class="swal2-input" placeholder="Número de Cuenta">
            <input id="swal-pin" type="password" class="swal2-input" placeholder="PIN">
            <input id="swal-balance" type="number" class="swal2-input" placeholder="Saldo Inicial">`,
        showCancelButton: true,
        confirmButtonText: 'Crear',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const accountNumber = document.getElementById('swal-account-number').value;
            const pin = document.getElementById('swal-pin').value;
            const balance = document.getElementById('swal-balance').value;

            if (!accountNumber || !pin || !balance) {
                Swal.showValidationMessage('Todos los campos son obligatorios');
                return false;
            }
            return { accountNumber, pin, balance };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { accountNumber, pin, balance } = result.value;
            createNewAccount(accountNumber, pin, balance);
        }
    });
});



// Función para cargar las cuentas desde el archivo JSON
// Cargar cuentas desde JSON y movimientos desde localStorage
async function loadAccounts() {
    try {
        const response = await fetch('cuentas.json');
        let accountsFromFile = await response.json();

        // Cargar cuentas guardadas en localStorage
        let accountsFromStorage = JSON.parse(localStorage.getItem('cuentas')) || [];

        // Combinamos las cuentas de JSON con las de localStorage
        let allAccounts = [...accountsFromFile, ...accountsFromStorage];

        allAccounts.forEach(account => {
            const storedAccount = localStorage.getItem(account.accountNumber);
            if (storedAccount) {
                const parsedAccount = JSON.parse(storedAccount);
                account.balance = parsedAccount.balance;
            }
        });

        accounts = allAccounts;
        console.log('Cuentas cargadas:', accounts);
    } catch (error) {
        console.error('Error al cargar las cuentas:', error);
    }
}


function saveAccountState() {
    if (currentAccount) {
        // Actualizar la cuenta en localStorage
        let accounts = JSON.parse(localStorage.getItem('cuentas')) || [];
        const index = accounts.findIndex(acc => acc.accountNumber === currentAccount.accountNumber);

        if (index !== -1) {
            accounts[index].balance = currentAccount.balance;
        } else {
            accounts.push(currentAccount);
        }

        localStorage.setItem('cuentas', JSON.stringify(accounts));
    }
}

function accept() {
    const amount = parseFloat(currentInput);
    if (currentOperation === 'deposit' && amount > 0) {
        currentAccount.balance += amount;
        saveAccountState();
        Swal.fire('Depósito Exitoso', `Has depositado $${amount}. Tu nuevo saldo es: $${currentAccount.balance}`, 'success');
    } else if (currentOperation === 'withdraw' && amount > 0) {
        if (amount <= currentAccount.balance) {
            currentAccount.balance -= amount;
            saveAccountState();
            Swal.fire('Retiro Exitoso', `Has retirado $${amount}. Tu nuevo saldo es: $${currentAccount.balance}`, 'success');
        } else {
            Swal.fire('Fondos Insuficientes', 'No tienes suficiente saldo para esta transacción.', 'error');
        }
    } else {
        Swal.fire('Operación Inválida', 'Por favor, ingrese una cantidad válida.', 'error');
    }
    currentOperation = null;
    currentInput = '';
    document.getElementById('input-field').value = '';
}

// Función para mostrar mensajes en la pantalla del cajero
function showMessage(message) {
    document.getElementById('message').innerText = message;
}

// Función para manejar el inicio de sesión
function login() {
    const accountNumber = document.getElementById('account-number').value;
    const pin = document.getElementById('pin').value;
    
    currentAccount = accounts.find(account => 
        account.accountNumber === accountNumber && account.pin === pin
    );

    if (currentAccount) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('atm-screen').style.display = 'block';
        showMessage(`Bienvenido, cuenta ${currentAccount.accountNumber}.`);
    } else {
        document.getElementById('login-message').innerText = 'Número de cuenta o PIN incorrecto. Inténtelo de nuevo.';
    }
}

// Función para consultar el saldo
function checkBalance() {
    showMessage(`Su saldo actual es: $${currentAccount.balance}`);
}

// Función para depositar dinero
function depositMoney() {
    currentOperation = 'deposit';
    Swal.fire({
        title: 'Ingrese la cantidad a depositar',
        input: 'number',
        inputAttributes: {
            min: 1,
            step: 1,
        },
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
        preConfirm: (amount) => {
            return new Promise((resolve, reject) => {
                if (amount && amount > 0) {
                    resolve(amount);
                } else {
                    reject('Ingrese una cantidad válida.');
                }
            });
        }
    }).then(result => {
        if (result.isConfirmed) {
            currentInput = result.value;
            accept();
        }
    });
}

// Actualizar la función withdrawMoney para usar SweetAlert2
function withdrawMoney() {
    currentOperation = 'withdraw';
    Swal.fire({
        title: 'Ingrese la cantidad a retirar',
        input: 'number',
        inputAttributes: {
            min: 1,
            step: 1,
        },
        showCancelButton: true,
        confirmButtonText: 'Aceptar',
        cancelButtonText: 'Cancelar',
        preConfirm: (amount) => {
            return new Promise((resolve, reject) => {
                if (amount && amount > 0) {
                    resolve(amount);
                } else {
                    reject('Ingrese una cantidad válida.');
                }
            });
        }
    }).then(result => {
        if (result.isConfirmed) {
            currentInput = result.value;
            accept();
        }
    });
}

// Función para cerrar sesión
function logout() {
    currentAccount = null;
    document.getElementById('atm-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'block';
    document.getElementById('login-message').innerText = '';
    showMessage("Bienvenido. Seleccione una opción:");
}

// Asociamos los botones a las funciones
document.getElementById('login').addEventListener('click', login);
document.getElementById('check-balance').addEventListener('click', checkBalance);
document.getElementById('deposit-money').addEventListener('click', depositMoney);
document.getElementById('withdraw-money').addEventListener('click', withdrawMoney);
document.getElementById('logout').addEventListener('click', logout);

// Cargar las cuentas al iniciar la aplicación
loadAccounts();