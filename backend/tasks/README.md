Certainly! Here's an example README.md file for the script you provided:

# Tee Time Checker

This script is designed to periodically check for available tee times at specified golf courses and send email notifications to registered users. It utilizes various APIs and database queries to gather tee time information and deliver notifications.

## Features

- Retrieves tee time data from multiple sources, including ForeUp, Navy, TeeItUp, and JCGolf.
- Supports multiple golf courses and users.
- Sends email notifications to users with available tee times.
- Logs errors and notifications using Winston logging library.
- Utilizes MySQL database for storing user preferences and notification history.
- Configurable cron job scheduling for tee time checks.

## Prerequisites

Before running the script, ensure you have the following dependencies installed:

- Node.js
- MySQL database
- SMTP server for sending emails (e.g., Gmail)

## Installation

1. Clone this repository to your local machine.

```bash
git clone https://github.com/your-username/tee-time-checker.git
```

2. Navigate to the project directory.

```bash
cd tee-time-checker
```

3. Install the required dependencies using npm.

```bash
npm install
```

4. Create a `.env` file in the project directory and populate it with the necessary environment variables. Refer to the `.env.example` file for the required variables.

## Configuration

The script can be configured by modifying the `config.js` file. Update the database and email configuration settings as per your environment.

## Usage

To start the tee time checker, run the following command:

```bash
npm start
```

This will initiate the cron job that periodically checks for tee times and sends notifications to registered users. The script will run indefinitely until terminated.

## Customization

- To add more golf courses, modify the `courses` table in your MySQL database and include the required information.
- To add more tee time sources, create new functions similar to `foreupFunction`, `navyFunction`, `teeitupFunction`, and `jcgolfFunction`. Update the main script (`index.js`) to include the new source and modify the `checkTeeTimes` function accordingly.
- To customize the email notification template, modify the HTML code in the `sendEmails` function.

## Logging

The script utilizes the Winston logging library to record errors and notifications. Log files are stored in the project directory and include:

- `error.log`: Contains errors and exceptions encountered during the script execution.
- `combined.log`: Contains all log messages, including errors and notifications.

## License

This project is licensed under the [MIT License](LICENSE).

Feel free to customize and enhance the script according to your requirements. If you encounter any issues or have suggestions for improvement, please open an issue or submit a pull request.