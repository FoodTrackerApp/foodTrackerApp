# foodTrackerApp
A react native App for the FoodTracker "eco system"

![screenshot](https://i.imgur.com/YqzyJWn.jpg)

For the (optional) Webapp and Server, go to [FoodTrackerNext]

## Features

- Offline Mode
- Server Mode (With FoodTrackerNext)
- Shopping list


# Installation

Prerequisites:
- eas or expo (comes with eas)

## Android install

### 1. Clone the Repo
Do that however you like, e.g. using GitHub CLI:
```sh
gh repo clone cr4yfish/foodTrackerApp
```

### 2. Install packages
- npm i or yarn
```sh
npm i
```
or
```sh
yarn
```

### 3. Build for Android
```sh
npx eas build -p android --profile preview
```

This will take some time. After completion it will output a direct download link to the .apk.

### 4. Install on the Android Device
- Open the link on any Android Device
- Download the file and
- Open it, Android will then ask you if you want to install the App, hit "yes".

Done.

## Notice
You might need to enable an option to install Apps from external sources. Just google how to do it with your Device / Android Version.

## IOS install

Follow the same steps as above until step 3.
You then just need to do
```sh
npx eas build:config
```
and follow the assistant to build for IOS.

After the build you need to find a way to install it onto your Apple Device.
I recommend using a 3rd party App launcher.

[FoodTrackerApp]: <https://github.com/cr4yfish/food-tracker-next>
