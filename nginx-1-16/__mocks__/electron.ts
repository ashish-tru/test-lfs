import path from 'path'
export const ipcMain = {
    handle:jest.fn()
  };
export const app = {
  getName :jest.fn(),
  getVersion:jest.fn(),
  getAppPath:jest.fn(()=>{
    const packagePath =  path.resolve(__dirname, `../../`)
    return packagePath
  })
}
