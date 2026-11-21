// App screenshots from the beta build (Flutter, sample scan data).
import changeLight from "../../public/screens/change-light.png";
import fatDark from "../../public/screens/fat-dark.png";
import homeDark from "../../public/screens/home-dark.png";
import homeLight from "../../public/screens/home-light.png";
import connectDark from "../../public/screens/onboarding-connect-dark.png";
import connectLight from "../../public/screens/onboarding-connect-light.png";
import consentDark from "../../public/screens/onboarding-consent-dark.png";
import consentLight from "../../public/screens/onboarding-consent-light.png";
import goalsDark from "../../public/screens/onboarding-goals-dark.png";
import goalsLight from "../../public/screens/onboarding-goals-light.png";

export const screens = {
  home: { light: homeLight, dark: homeDark },
  fat: { light: fatDark },
  change: { light: changeLight },
  connect: { light: connectLight, dark: connectDark },
  consent: { light: consentLight, dark: consentDark },
  goals: { light: goalsLight, dark: goalsDark },
};
