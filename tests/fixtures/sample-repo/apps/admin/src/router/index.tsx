import { Route, Switch } from "react-router-dom";
import HospitalDetailContainer from "../domains/hospital/containers/HospitalDetailContainer";

export const AppRouter = () => (
  <Switch>
    <Route path="/hospital/:id" component={HospitalDetailContainer} />
  </Switch>
);
