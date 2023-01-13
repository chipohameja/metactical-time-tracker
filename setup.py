from setuptools import setup, find_packages

with open("requirements.txt") as f:
	install_requires = f.read().strip().split("\n")

# get version from __version__ variable in metactical_time_tracker/__init__.py
from metactical_time_tracker import __version__ as version

setup(
	name="metactical_time_tracker",
	version=version,
	description="Time tracking app",
	author="Metactical",
	author_email="chipohameja@gmail.com",
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
