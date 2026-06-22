import api from './api';

const studentService = {
  getTrainingPoints: (mssv, namHoc) =>
    api.get(`/api/diem-ren-luyen/sinh-vien/${mssv}`, { params: { maNamHoc: namHoc } })
      .then(r => r.data.data ?? []),

  getProfile: (mssv) =>
    api.get(`/api/sinh-vien/${mssv}`).then(r => r.data.data),

  getAcademicYears: () =>
    api.get('/api/nam-hoc').then(r => r.data.data ?? []),
};

export default studentService;
