pub async fn browse() -> String {
    if cfg!(windows) {
        let cmd = "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; if($f.ShowDialog() -eq 'OK') { $f.SelectedPath }";
        let output = std::process::Command::new("powershell")
            .args(["-Command", cmd])
            .output()
            .expect("failed to execute powershell");
        String::from_utf8_lossy(&output.stdout).trim().to_string()
    } else {
        "/".to_string()
    }
}
