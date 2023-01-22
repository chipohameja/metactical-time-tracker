# Copyright (c) 2023, Metactical and contributors
# For license information, please see license.txt

import frappe
from datetime import datetime
from frappe.model.document import Document

class TimeTrackerSettings(Document):
	def validate(self):
		for i, item in enumerate(sorted(self.pay_cycles, key=lambda item: item.from_date, reverse=True), start=1):
			item.idx = i