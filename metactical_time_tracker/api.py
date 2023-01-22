import frappe
import datetime

#Check if logged in user has current pay cycle record
@frappe.whitelist()
def check_current_pay_cycle_record(current_date, current_time):
    user = frappe.session.user
    
    #Get current pay cycle
    current_pay_cycle_exists = frappe.db.exists("Pay Cycle Record", {
        "from_date": ("<=", current_date),
        "to_date": (">=", current_date)
    })

    if current_pay_cycle_exists:
        from_date = frappe.get_value("Pay Cycle Record", current_pay_cycle_exists, "from_date")
        to_date = frappe.get_value("Pay Cycle Record", current_pay_cycle_exists, "to_date")

        user_pay_cycle_record_exists = frappe.db.exists("Pay Cycle", {
            "user": user,
            "from_date": from_date,
            "to_date": to_date
        })

        if not user_pay_cycle_record_exists:
            create_user_pay_cycle_record(user, from_date, to_date, current_date, current_time)

        else:
            clockin_log_record_today_exists = frappe.db.exists("Clockin Log", {
                "user": user,
                "date": current_date
            })

            if not clockin_log_record_today_exists:
                create_clockin_log(user, current_date, current_time)

    else:
        frappe.msgprint("Couldn not find pay cycle period. Contact administrator")

    user_pay_cycle_record = frappe.db.exists("Pay Cycle", {
        "user": user,
        "from_date": ("<=", current_date),
        "to_date": (">=", current_date),
    })

    user_pay_cycle = frappe.get_doc("Pay Cycle", user_pay_cycle_record)
    return user_pay_cycle

def create_user_pay_cycle_record(user, from_date, to_date, current_date, current_time):
    user_pay_cycle_record = frappe.get_doc({
        "doctype": "Pay Cycle",
        "user": user,
        "from_date": from_date,
        "to_date": to_date
    })

    user_pay_cycle_record.insert()

    #Create child day records
    index = 1
    date_index = from_date 

    while date_index != to_date:
        row = user_pay_cycle_record.append("days", {
            "date": date_index
        })

        row.insert()
        
        date_index = from_date + datetime.timedelta(days=index)
        index += 1

    row = user_pay_cycle_record.append("days", {
        "date": date_index
    })

    row.insert()

    create_clockin_log(user, current_date, current_time)

    frappe.errprint(index)
    frappe.errprint(date_index)
    frappe.errprint(to_date)
    frappe.errprint(date_index == to_date)

def create_clockin_log(user, current_date, from_time):
    clockin_log_record = frappe.get_doc({
        "doctype": "Clockin Log",
        "user": user,
        "date": current_date,
        "from_time": from_time
    })

    clockin_log_record.insert()

@frappe.whitelist()
def update_clockin_log(current_date, to_time):
    user = frappe.session.user

    clockin_log_record = frappe.db.exists("Clockin Log", {
        "user": user,
        "date": current_date,
    })

    clockin_log = frappe.get_doc("Clockin Log", clockin_log_record)
    clockin_log.to_time = to_time
    clockin_log.has_clocked_out = 1
    clockin_log.save()
