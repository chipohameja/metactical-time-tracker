const clockInButton = document.getElementById("clock-in-btn");
const clockOutButton = document.getElementById("clock-out-btn");

const prevButton = document.getElementById("prev-button")
const nextButton = document.getElementById("next-button")

let button_activation_delay = 1;

let payCycles;
let prevPayCycles = 0;
let shiftSelected = false;
let selectedDate;
let selectedShiftType = "";
let current_shift_name = "";

let pageIndex = 0;
let countIndex = 0;

clockInButton.onclick = clockIn
clockOutButton.onclick = clockOut
prevButton.onclick = onPrevButton
nextButton.onclick = onNextButton

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
    //buttonActivationDelay(clockInButton)

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
            }

            else {
                notify('danger', 'Invalid credentials')
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
            onClockOut("Logout success")
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
            console.log(r.message)
            //table(r.message.pay_cycles)
            if (r.message.clockin_status == 1) {
                payCycles = r.message.pay_cycles
                button_activation_delay = r.message.button_activation_delay
                validateLogin()
                prevPayCycles = r.message.pay_cycles.length - 1
                validateButtons()
                toggleTable()

                $("#starts-at").text(r.message.current_shift.start_time)
                $("#ends-at").text(r.message.current_shift.end_time)
                current_shift_name = r.message.current_shift.name
                
                //Display success message
                notify('success', 'Login success');
            }

            else {
                let message = "Clockin too early"

                //Log user out
                onClockOut(message)
            }
        }
    });
}

function onClockOut(message) {
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
            notify('danger', message);
            if (!document.getElementById("pay-cycle").classList.contains("d-none")){
                toggleTable()
            }
            //toggleTable()
            showLogin()
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

const table = (tableData) => {
    const trh1 = $("#trh1")
    const trh2 = $("#trh2")

    const trb1 = $("#trb1")
    const trb2 = $("#trb2")
    const totalHoursWorked = $("#total-hours-worked")

    trh1.empty()
    trh2.empty()
    trb1.empty()
    trb2.empty()
    totalHoursWorked.empty()

    //let pageIndex = 0;
    countIndex = 0;

    //const numPayCycles = tableData.length 
    console.log(pageIndex)

    if (tableData[pageIndex].days.length > 6) {
        for (; countIndex <= 6; countIndex++) {
            trh1.append(`<th class="table-btn" scope="col">${dateFormatter(tableData[pageIndex].days[countIndex].date)}<span class='d-none'>${tableData[pageIndex].days[countIndex].date}</span></th>`)
            trb1.append(`<td scope="col">${Math.round(tableData[pageIndex].days[countIndex].hours_worked)} hours</td>`)
            console.log("looping")
        }
        console.log(trh1)
    }

    for (; countIndex < tableData[pageIndex].days.length; countIndex++) {
        trh2.append(`<th class="table-btn" scope="col">${dateFormatter(tableData[pageIndex].days[countIndex].date)}<span class='d-none'>${tableData[pageIndex].days[countIndex].date}</span></th>`)
        trb2.append(`<td scope="col">${Math.round(tableData[pageIndex].days[countIndex].hours_worked)} hours</td>`)
    }

    totalHoursWorked.text(`Total: ${Math.round(tableData[pageIndex].total_hours_worked)} hours`)

    validateButtons()
}

function dateFormatter(date) {
    const formattedDate = new Date(date).toDateString().slice(0, 10);
    return formattedDate;
}

const validateLogin = () => {
    //hide form
    const form = $("#auth")
    form.hide()

    table(payCycles)
}

const showLogin = () => {
    const form = $("#auth")
    form.show()
}

//const validateTable = () => { }

const validateButtons = () => {
    validatePrevButton();
    validateNextButton();
}

const validatePrevButton = () => {
    if (pageIndex >= prevPayCycles || prevPayCycles <= 0) {
        prevButton.setAttribute("disabled", "")
    }

    else {
        prevButton.removeAttribute("disabled")
    }
}

const validateNextButton = () => {
    if (pageIndex <= 0) {
        nextButton.setAttribute("disabled", "")
    }

    else {
        nextButton.removeAttribute("disabled")
    }
}

function onPrevButton() {
    pageIndex += 1
    table(payCycles)
}

function onNextButton() {
    pageIndex -= 1
    table(payCycles)
}

function buttonActivationDelay(button) {
    button.setAttribute("disabled", "")

    setTimeout(() => {
        button.removeAttribute("disabled")
    }, button_activation_delay * 1000)
}

function toggleTable () {
    const payCycleTable = document.getElementById("pay-cycle")
    payCycleTable.classList.toggle("d-none")
}

$("body").on("click", ".table-btn", function () {
    //alert("Clicked")    
    console.log($(this).children("span").text())
    getDateDetails($(this).children("span").text())
    selectedDate = $(this).children("span").text()
})

function getDateDetails(date) {
    frappe.call({
        method: "metactical_time_tracker.api.get_date_details",
        args: {
            date: date
        },
        callback: r => {
            displayDateDetails(date, r.message.clockins)
            shift_info = document.getElementById("shift-info")
            
            if(shift_info.classList.contains("d-none")) {
                shift_info.classList.toggle("d-none")
            }
        }
    })
}

function displayDateDetails(date, clockins) {
    let dateDetails = $("#details")
    dateDetails.empty()

    dateDetails.append(`<span class="font-weight-bold">Date: </span><span>${dateFormatter(date)}</span>`)
    
    for (let i = 0; i < clockins.length; i++) {
        dateDetails.append(`
            <div>
                <div><p class="font-weight-bold">Clocked In: </p><span>${clockins[i].from_time}</span></div>
                <div><p class="font-weight-bold">Clocked Out: </p><span>${clockins[i].to_time}</span></div>
            </div>
        `)
    }
}

function sliceTime(time) {
    let slicedTime;
    console.log(time)
    if (time.length == 7) {
        let fullLengthTime = `0${time}`
        slicedTime = `${fullLengthTime.slice(0, 5)}`
    }
    
    else {
        slicedTime = `${time.slice(0, 5)}`
    }
    
    return slicedTime;
}

$("body").on("click", ".dropdown-item", function () {
    $("#select-shift-button").text($(this).children(".shift-time").text())
    selectedShiftType = $(this).children(".shift-name").text()
    shiftSelected = true
})

$("body").on("click", "#request-shift-change-button", function () {
    frappe.call({
        method: "metactical_time_tracker.api.get_shifts",
        args: {
            current_shift_name: current_shift_name
        },
        callback: r => {
            console.log(r.message)
            $("#shifts").empty()

            for (let i = 0; i < r.message.shifts.length; i++) {
                //const element = r.message.shifts[i];
                $("#shifts").append(
                    `<p class="dropdown-item">
                        <span class="shift-time">${sliceTime(r.message.shifts[i].start_time)} - ${sliceTime(r.message.shifts[i].end_time)}</span>
                        <span class="shift-name d-none">${r.message.shifts[i].name}</span>
                    </p>`)
            }
        }
    })
})

$("body").on("click", "#shift-change-submit", function() {
    //let shift_type = $("#shifts").text($(this).children(".shift-time").text())

    console.log(selectedShiftType)
    frappe.call({
        method: "metactical_time_tracker.api.shift_request",
        args: {
            "shift_type": selectedShiftType,
            "date": selectedDate
        },
        callback: r => {
            console.log(r.message)
            $("#change-shift-modal").modal("hide")
            $("#success-modal").modal("show")
        }
    })
})