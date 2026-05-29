import { Route, BrowserRouter as Router } from "react-router-dom";
import { retryLazy } from "helpers/retryLazy";

// Lazy + baseUrl import — the legacy JS pattern.
const Home = retryLazy(() => import("components/pages/Home"));

export const App = () => (
  <Router>
    <Route path="/home" exact component={Home} />
  </Router>
);
