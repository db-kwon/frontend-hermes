import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const hospitalApi = createApi({
  reducerPath: "hospitalApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/admin" }),
  endpoints: (builder) => ({
    getHospitalById: builder.query<{ id: number; name: string }, { id: number }>({
      query: ({ id }) => `/hospital/${id}`,
    }),
    updateHospital: builder.mutation<void, { id: number; name: string }>({
      query: (body) => ({ url: `/hospital/${body.id}`, method: "PUT", body }),
    }),
  }),
});

export const { useGetHospitalByIdQuery, useUpdateHospitalMutation } = hospitalApi;
