const prompt = require("prompt");

prompt.start();

console.log("Welcome to Rock, Paper, Scissors!");

prompt.get(["userSelection"], function (err, result) {
    if (err) {
        console.error("Error getting input:", err);
        return;
    }

    let userSelection = result.userSelection.toUpperCase();

    if (!["ROCK", "PAPER", "SCISSORS"].includes(userSelection)) {
        console.log("Invalid choice! Please choose ROCK, PAPER, or SCISSORS.");
        return;
    }

    // Generate computer selection
    let randomValue = Math.random();
    let computerSelection =
        randomValue < 0.34 ? "PAPER" :
        randomValue < 0.67 ? "SCISSORS" :
        "ROCK";

    console.log(`You chose: ${userSelection}`);
    console.log(`Computer chose: ${computerSelection}`);
// Import the prompt module
const prompt = require("prompt");

// Start the prompt system
prompt.start();

console.log("Welcome to Rock, Paper, Scissors!");

// Ask the user for their selection
prompt.get(["userSelection"], function (err, result) {
    if (err) {
        console.error("Error getting input:", err);
        return;
    }

    // Convert user input to uppercase for consistency
    let userSelection = result.userSelection.trim().toUpperCase();

    // Validate input
    if (!["ROCK", "PAPER", "SCISSORS"].includes(userSelection)) {
        console.log("Invalid choice! Please enter ROCK, PAPER, or SCISSORS.");
        return;
    }

    // Generate computer selection using Math.random()
    let randomValue = Math.random();
    let computerSelection;
    if (randomValue < 0.34) {
        computerSelection = "ROCK";
    } else if (randomValue < 0.67) {
        computerSelection = "PAPER";
    } else {
        computerSelection = "SCISSORS";
    }

    // Display choices
    console.log(`You chose: ${userSelection}`);
    console.log(`Computer chose: ${computerSelection}`);

    // Determine the winner using if-else statements
    if (userSelection === computerSelection) {
        console.log("It's a tie!");
    } else if (
        (userSelection === "ROCK" && computerSelection === "SCISSORS") ||
        (userSelection === "PAPER" && computerSelection === "ROCK") ||
        (userSelection === "SCISSORS" && computerSelection === "PAPER")
    ) {
        console.log("User Wins!");
    } else {
        console.log("Computer Wins!");
    }
});

    // Determine the winner
    if (userSelection === computerSelection) {
        console.log("It's a tie!");
    } else if (
        (userSelection === "ROCK" && computerSelection === "SCISSORS") ||
        (userSelection === "PAPER" && computerSelection === "ROCK") ||
        (userSelection === "SCISSORS" && computerSelection === "PAPER")
    ) {
        console.log("User Wins!");
    } else {
        console.log("Computer Wins!");
    }
});
