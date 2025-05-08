export default (req, res) => {
  res.status(200).json({ 
    status: "OK",
    message: "Backend API is running",
    endpoints: {
      getProjects: "/api/project/list",
      images: "/img/{filename}"
    }
  });
};