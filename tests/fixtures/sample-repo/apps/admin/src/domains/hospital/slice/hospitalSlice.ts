import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";

type Hospital = { id: number; name: string };

export const hospitalSlice = createSlice({
  name: "hospital",
  initialState: { current: null as Hospital | null },
  reducers: {
    setHospital: (state, action: PayloadAction<Hospital>) => {
      state.current = action.payload;
    },
  },
});

export const { setHospital } = hospitalSlice.actions;
export const useAppDispatch = () => useDispatch();
