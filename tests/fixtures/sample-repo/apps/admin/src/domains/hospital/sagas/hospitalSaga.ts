import { call, put, takeLatest } from "redux-saga/effects";
import axios from "axios";
import { setHospital } from "../slice/hospitalSlice";

function* fetchHospital(action: { type: string; payload: { id: number } }) {
  const response: { data: { id: number; name: string } } = yield call(
    axios.get,
    `/admin/hospital/${action.payload.id}/legacy`
  );
  yield put(setHospital(response.data));
}

export function* hospitalSaga() {
  yield takeLatest("hospital/fetchRequest", fetchHospital);
}
