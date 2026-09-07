// 1. Impor module yang diperlukan dari Firebase dan Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"

import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    deleteDoc,
    increment
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"


// 2. Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA9Y7W9t_3MFRj4oRybnr8MuUU8IiVC1b0",
    authDomain: "rpl2528-720aa.firebaseapp.com",
    projectId: "rpl2528-720aa",
    storageBucket: "rpl2528-720aa.firebasestorage.app",
    messagingSenderId: "715967831691",
    appId: "1:715967831691:web:475f2e70041657c2bd3e8e"
}


// 3. Inisialisasi Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const medsosCollection = collection(db, "medsos")


// Fungsi Toast
function tampilToast(pesan) {
    const toast = document.getElementById("toast")
    if (!toast) return

    toast.innerText = pesan
    toast.classList.add("show")

    setTimeout(() => {
        toast.classList.remove("show")
    }, 2500)
}


// 4. Membuat postingan
async function postingStatus() {

    let teks = document.getElementById("isiStatus").value.trim()

    if (teks === "") {
        tampilToast("⚠️ Postingan tidak boleh kosong!")
        return
    }

    try {

        await addDoc(medsosCollection, {
            konten: teks,
            likes: 0,
            waktu: serverTimestamp()
        })

        document.getElementById("isiStatus").value = ""

        tampilToast("✅ Status berhasil ditambahkan!")

    } catch (error) {

        console.error(error)
        tampilToast("❌ Gagal menambahkan status.")

    }
}


// 5. Timeline
function muatTimeline() {

    if (!document.getElementById("timeline")) return

    const q = query(
        medsosCollection,
        orderBy("waktu", "desc")
    )

    const daftarLike =
        JSON.parse(localStorage.getItem("SUDAH_LIKE")) || []

    const suaraPostinganBaru =
        new Audio("notifikasi.mp3")

    let jumlahPostinganSebelumnya = null


    onSnapshot(q, (snapshot) => {

        // Suara jika ada postingan baru
        if (
            jumlahPostinganSebelumnya !== null &&
            snapshot.size > jumlahPostinganSebelumnya
        ) {

            suaraPostinganBaru.currentTime = 0

            suaraPostinganBaru.play().catch((error) => {
                console.log("Suara gagal:", error)
            })
        }

        jumlahPostinganSebelumnya = snapshot.size


        let output = ""


        snapshot.forEach((docSnapshot) => {

            let data = docSnapshot.data()
            let id = docSnapshot.id

            let sudahLike =
                daftarLike.includes(id)
                    ? "liked"
                    : ""


            output += `
                <div class="post-card">

                    <div class="post-content">
                        ${data.konten}
                    </div>

                    <button
                        id="btn-like-${id}"
                        class="btn-like ${sudahLike}"
                        onclick="sukaStatus('${id}')">

                        ❤️ ${data.likes} Likes

                    </button>

                </div>
            `
        })


        document.getElementById("timeline").innerHTML =
            output

    })
}


// 6. Like
async function sukaStatus(idDokumen) {

    let daftarLike =
        JSON.parse(localStorage.getItem("SUDAH_LIKE")) || []


    if (daftarLike.includes(idDokumen)) {

        tampilToast(
            "⚠️ Kamu sudah menyukai status ini!"
        )

        return
    }


    try {

        await updateDoc(
            doc(db, "medsos", idDokumen),
            {
                likes: increment(1)
            }
        )


        daftarLike.push(idDokumen)

        localStorage.setItem(
            "SUDAH_LIKE",
            JSON.stringify(daftarLike)
        )


        const tombol =
            document.getElementById(
                `btn-like-${idDokumen}`
            )


        if (tombol) {
            tombol.classList.add("liked")
        }


        // 🔊 Suara Like
        bunyiLike()


        tampilToast(
            "❤️ Terima kasih sudah memberi Like!"
        )


    } catch (error) {

        console.error(error)

        tampilToast(
            "❌ Gagal memberikan like."
        )

    }
}


// 🔊 Fungsi suara Like
function bunyiLike() {

    const audio = new AudioContext()

    const oscillator =
        audio.createOscillator()

    const gain =
        audio.createGain()


    oscillator.frequency.value = 800

    oscillator.connect(gain)

    gain.connect(audio.destination)


    oscillator.start()


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audio.currentTime + 0.2
    )


    oscillator.stop(
        audio.currentTime + 0.2
    )
}


// 7. Daftar postingan Admin
function muatDaftarAdmin() {

    const tempat =
        document.getElementById("daftarAdmin")

    if (!tempat) return


    const q = query(
        medsosCollection,
        orderBy("waktu", "desc")
    )


    onSnapshot(q, (snapshot) => {

        let output = ""


        if (snapshot.empty) {

            output =
                "<p>Belum ada postingan.</p>"

        } else {

            snapshot.forEach((docSnapshot) => {

                let data =
                    docSnapshot.data()

                let id =
                    docSnapshot.id


                output += `
                    <div class="post-card">

                        <div
                            class="post-content"
                            id="konten-${id}"
                        >
                            ${data.konten}
                        </div>


                        <button
                            class="btn-edit"
                            onclick="editPostingan('${id}')"
                        >
                            ✏️ Edit
                        </button>


                        <button
                            class="btn-delete"
                            onclick="hapusStatus('${id}')"
                        >
                            🗑️ Hapus Post
                        </button>

                    </div>
                `
            })
        }


        tempat.innerHTML = output

    })
}


// 8. ✏️ EDIT POSTINGAN
async function editPostingan(idDokumen) {

    const elemen =
        document.getElementById(
            `konten-${idDokumen}`
        )


    if (!elemen) return


    const isiLama =
        elemen.innerText


    const isiBaru =
        prompt(
            "✏️ Edit postingan:",
            isiLama
        )


    // Jika tekan Cancel
    if (isiBaru === null) return


    // Jika kosong
    if (isiBaru.trim() === "") {

        tampilToast(
            "⚠️ Postingan tidak boleh kosong!"
        )

        return
    }


    try {

        await updateDoc(
            doc(db, "medsos", idDokumen),
            {
                konten: isiBaru.trim()
            }
        )


        tampilToast(
            "✅ Postingan berhasil diedit!"
        )


    } catch (error) {

        console.error(error)

        tampilToast(
            "❌ Gagal mengedit postingan."
        )

    }
}


// 9. Hapus postingan
async function hapusStatus(idDokumen) {

    if (
        !confirm(
            "Apakah Anda yakin ingin menghapus postingan ini?"
        )
    ) {
        return
    }


    try {

        await deleteDoc(
            doc(db, "medsos", idDokumen)
        )


        tampilToast(
            "🗑️ Postingan berhasil dihapus!"
        )


    } catch (error) {

        console.error(error)

        tampilToast(
            "❌ Gagal menghapus postingan."
        )

    }
}


// 10. Daftarkan fungsi ke HTML
window.postingStatus = postingStatus
window.sukaStatus = sukaStatus
window.hapusStatus = hapusStatus
window.editPostingan = editPostingan


// 11. Jalankan fungsi
muatTimeline()
muatDaftarAdmin()