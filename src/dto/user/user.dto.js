export const createUserDTO = (body) => {
  return {
    name: body.name,
    email: body.email,
    password: body.password
  };
};