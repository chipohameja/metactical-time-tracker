const clockInButton = document.getElementById("clock-in-btn");
const clockOutButton = document.getElementById("clock-out-btn");

clockInButton.onclick = clockIn
clockOutButton.onclick = clockOut

frappe.ready(function () {
    //Check if clocked in on load
    if (frappe.session.user != "Guest") {
        //Validate button states if clocked in
        onClockIn();
    }

    //Display buttons
    clockInButton.classList.toggle('d-none');
    clockOutButton.classList.toggle('d-none');
});

//Clock
let current_time;

function startTime() {
    const today = new Date();
    let h = today.getHours();
    let m = today.getMinutes();
    let s = today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);
    document.getElementById('clock').innerHTML = h + ":" + m + ":" + s;
    current_time = h + ":" + m + ":" + s;
    setTimeout(startTime, 1000);
}

function checkTime(i) {
    if (i < 10) { i = "0" + i };  // add zero in front of numbers < 10
    return i;
}

startTime();

function clockIn() {
    //Clockin/Login
    fetch(`${window.origin}/api/method/login`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            usr: document.getElementById('email').value,
            pwd: document.getElementById('password').value
        })
    })
        .then(r => r.json())
        .then(r => {
            console.log(r);
            if (r.message == 'Logged In') {
                //Clock in success
                onClockIn();

                //Display success message
                notify('success', r.message);
            }
        })
}

function clockOut() {
    //Clockout/Log out
    const date = new Date();
    const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    frappe.call({
        method: "metactical_time_tracker.api.update_clockin_log",
        args: {
            current_date: today,
            to_time: current_time
        },
        callback: r => {
            console.log("Logging out")
            console.log(r)
            onClockOut()
        }
    });

    
}

function onClockIn() {
    //grey out clockin button if success
    clockInButton.classList.toggle("btn-success");
    clockInButton.classList.toggle("btn-secondary");
    clockInButton.setAttribute("disabled", "");

    //red in clockout button if success
    clockOutButton.classList.toggle("btn-secondary");
    clockOutButton.classList.toggle("btn-danger");
    clockOutButton.removeAttribute("disabled");

    //Call api after login
    const date = new Date();
    const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

    frappe.call({
        method: "metactical_time_tracker.api.check_current_pay_cycle_record",
        args: {
            current_date: today,
            current_time: current_time
        },
        callback: r => {
            console.log(r)
        }
    });
}

function onClockOut() {
    fetch(`${window.origin}/api/method/logout`, {
        method: 'GET',
    })
        .then(r => r.json())
        .then(r => {
            console.log(r);

            //grey out clockout button if success
            clockOutButton.classList.toggle("btn-danger");
            clockOutButton.classList.toggle("btn-secondary");
            clockOutButton.setAttribute("disabled", "");

            //green in clockin button if success
            clockInButton.classList.toggle("btn-secondary");
            clockInButton.classList.toggle("btn-success");
            clockInButton.removeAttribute("disabled");
            //Display success message
            notify('danger', "Clockout success");
        })


}

function notify(type, message) {
    const dangerNotification = document.getElementById("danger-notification");
    const successNotification = document.getElementById("success-notification");

    if (type == 'success') {
        successNotification.textContent = message;
        successNotification.classList.toggle('d-none');

        setTimeout(() => {
            successNotification.classList.toggle('d-none');
        }, 5000);
    }

    else {
        dangerNotification.textContent = message;
        dangerNotification.classList.toggle('d-none');

        setTimeout(() => {
            dangerNotification.classList.toggle('d-none');
        }, 5000);
    }
}