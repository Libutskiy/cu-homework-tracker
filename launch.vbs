Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objShell = CreateObject("WScript.Shell")

' Change working directory to the directory of this VBScript
strPath = objFSO.GetParentFolderName(WScript.ScriptFullName)
objShell.CurrentDirectory = strPath

' Create a temporary Python script to find a free port and launch the server
tempFile = objFSO.GetSpecialFolder(2) & "\launch_temp_" & objFSO.GetTempName & ".py"
Set objFile = objFSO.CreateTextFile(tempFile, True)

objFile.WriteLine "import socket, subprocess, webbrowser"
objFile.WriteLine "s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)"
objFile.WriteLine "s.bind(('', 0))"
objFile.WriteLine "port = s.getsockname()[1]"
objFile.WriteLine "s.close()"
objFile.WriteLine "print(f'Starting server on http://127.0.0.1:{port}')"
objFile.WriteLine "webbrowser.open(f'http://127.0.0.1:{port}')"
objFile.WriteLine "subprocess.run([r'venv\Scripts\python.exe', '-m', 'uvicorn', 'main:app', '--port', str(port)])"
objFile.Close

' Run the temporary Python script using the project's virtual environment
' The second argument is 0 to run the server completely hidden in the background
objShell.Run "venv\Scripts\python.exe """ & tempFile & """", 0, False
