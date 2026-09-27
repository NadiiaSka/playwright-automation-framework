import axios from "axios";

const useAxios = () => {
  const fetchData = async (url, config = {}) => {
    const response = await axios.get(url, config);
    return response.data;
  };

  return fetchData;
};

export default useAxios;
