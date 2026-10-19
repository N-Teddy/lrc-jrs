// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Avoid WebKitGTK DMA-BUF renderer conflicts on Linux
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
        // Disable bwrap/bubblewrap sandbox that crashes WebKit NetworkProcess on modern Linux
        if std::env::var("WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS").is_err() {
            std::env::set_var("WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS", "1");
        }

        // Set GLib and GTK application metadata for Linux desktop environments (Wayland/X11)
        unsafe {
            #[link(name = "glib-2.0")]
            extern "C" {
                fn g_set_prgname(prgname: *const std::os::raw::c_char);
                fn g_set_application_name(app_name: *const std::os::raw::c_char);
            }
            g_set_prgname(b"com.ngangman-teddy.lrc-jrs\0".as_ptr() as *const _);
            g_set_application_name(b"LRC JRS\0".as_ptr() as *const _);
        }
    }

    desktop_lib::run()
}
