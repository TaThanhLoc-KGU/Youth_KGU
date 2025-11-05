const fs = require('fs');

// Handle StudentForm.jsx
let content1 = fs.readFileSync('frontend-react/src/components/admin/StudentForm.jsx', 'utf8');
content1 = content1.replace(
  `  const { data: classesList = [] } = useQuery(
    'classes',
    () => lopService.getAll(),
    {
      select: (data) => {
        const list = Array.isArray(data) ? data : data.content || [];
        return list.map(lop => ({
          value: lop.maLop,
          label: \`\${lop.maLop} - \${lop.tenLop || ''}\`
        }));
      }
    }
  );`,
  `  const { data: classesList = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => lopService.getAll(),
    select: (data) => {
      const list = Array.isArray(data) ? data : data.content || [];
      return list.map(lop => ({
        value: lop.maLop,
        label: \`\${lop.maLop} - \${lop.tenLop || ''}\`
      }));
    }
  });`
);
fs.writeFileSync('frontend-react/src/components/admin/StudentForm.jsx', content1, 'utf8');
console.log('✓ Converted StudentForm.jsx');

// Handle Activities.jsx (admin)
let content2 = fs.readFileSync('frontend-react/src/pages/admin/Activities.jsx', 'utf8');
content2 = content2.replace(
  `  const { data: activitiesData, isLoading, refetch } = useQuery(
    ['activities', page, size, search, statusFilter],
    () => activityService.getAllWithPagination({ page, size }),
    { keepPreviousData: true }
  );`,
  `  const { data: activitiesData, isLoading, refetch } = useQuery({
    queryKey: ['activities', page, size, search, statusFilter],
    queryFn: () => activityService.getAllWithPagination({ page, size }),
    keepPreviousData: true
  });`
);
fs.writeFileSync('frontend-react/src/pages/admin/Activities.jsx', content2, 'utf8');
console.log('✓ Converted Activities.jsx (admin)');

console.log('\n✓ All conversions complete!');
