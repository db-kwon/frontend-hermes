import { useGetHospitalByIdQuery, useUpdateHospitalMutation } from "../api/hospitalApi";
import { useAppDispatch } from "../slice/hospitalSlice";
import { setHospital } from "../slice/hospitalSlice";

export default function HospitalDetailContainer() {
  const { data } = useGetHospitalByIdQuery({ id: 1 });
  const [update] = useUpdateHospitalMutation();
  const dispatch = useAppDispatch();
  return <div onClick={() => dispatch(setHospital(data!))}>{data?.name}</div>;
}
