// Initialize Firebase
var config = {
    apiKey: "AIzaSyD5_BIlt95ye1JJ4bps_wXmH6eeA7JZCV8",
    authDomain: "reading-list-da983.firebaseapp.com",
    databaseURL: "https://reading-list-da983.firebaseio.com",
    projectId: "reading-list-da983",
    storageBucket: "",
    messagingSenderId: "247401003110"
};
firebase.initializeApp(config);

//Get all elements
const txtEmail = document.getElementById('txtEmail')
const txtPassword = document.getElementById('txtPassword')
const btnLogin = document.getElementById('btnLogin')
const btnSignUp = document.getElementById('btnSignUp')
const btnLogout = document.getElementById('btnLogout')
const notLoggedWrapper = document.getElementById('notLogged')
const btnCancel = document.getElementById('btnCancel')
const btnAddBook = document.getElementById('btnAddBook')
const txtTitle = document.getElementById('inputTitle')
const txtAuthor = document.getElementById('inputAuthor')
const libraryContainer = document.getElementById('library-container')
const txtPages = document.getElementById('inputPages')
const checkRead = document.getElementById('checkRead')
const mainContainer = document.getElementsByClassName('main-container')[0]
const addBookContainer = document.getElementsByClassName('add-book-container')[0]
const btnPlus = document.getElementById('btnPlus')


//Login event
btnLogin.addEventListener('click', e => {
    const email = txtEmail.value
    const password = txtPassword.value
    const auth = firebase.auth()
    const promise = auth.signInWithEmailAndPassword(email,password)
    promise.catch(e=> console.log(e.message))
    //TODO: reset text fields
})
//Sign up event
btnSignUp.addEventListener('click', e => {
    //TODO: check for real email
    const email = txtEmail.value
    const password = txtPassword.value
    const auth = firebase.auth()
    const promise = auth.createUserWithEmailAndPassword(email, password)
    promise.catch(e => console.log(e.message))
})
//Log out event
btnLogout.addEventListener('click', e => {
    firebase.auth().signOut()
})
//Add a realtime listener
firebase.auth().onAuthStateChanged(firebaseUser => {
    if(firebaseUser) {
        btnLogout.classList.remove('hide')
        notLoggedWrapper.classList.add('hide')
        mainContainer.classList.remove('hide')
        //clean up books in case user logs out/in without page refresh
        while(libraryContainer.firstChild) {
            libraryContainer.removeChild(libraryContainer.firstChild)
        }

        //Write the user to db
        let usersRef = firebase.database().ref('users')
        let userRef = usersRef.child(firebaseUser.uid)
        userRef.set({
            email: firebaseUser.email,
            uid: firebaseUser.uid
        })
        startDatabaseQueries()
    }
    else {
        console.log('user not logged in')
        btnLogout.classList.add('hide')
        notLoggedWrapper.classList.remove('hide')
        mainContainer.classList.add('hide')
    }
})


//Add book to user's library
btnAddBook.addEventListener('click', e => {
    const author = txtAuthor.value
    const title = txtTitle.value
    const pages = txtPages.value
    const read = checkRead.checked
    const userId = firebase.auth().currentUser.uid
    const dbUserLibrary = firebase.database().ref('books/').child(userId)
    dbUserLibrary.push({
        author: author,
        title: title,
        pages: pages,
        read: read
    })
    txtAuthor.value = ''
    txtTitle.value = ''
    txtPages.value = ''
    checkRead.checked = false
})

// Display books from database
function startDatabaseQueries() {
    const uid = firebase.auth().currentUser.uid
    const userLibrary = firebase.database().ref('books').child(uid)
    
    function fetchLibrary(libraryRef, sectionElement) {
        libraryRef.on('child_added', data => {
            const newBook = document.createElement('div')
            newBook.classList = 'new-book-container'
            newBook.id = `${data.key}`
            
            const bookDeletebtn = document.createElement('button')
            bookDeletebtn.classList.add('btn-delete-book')
            bookDeletebtn.innerText = 'X'

            const bookTitle = document.createElement('h2')
            bookTitle.innerText = `${data.val().title}`
            
            const bookAuthor = document.createElement('p')
            bookAuthor.innerText = `by ${data.val().author}`
            
            const bookPages = document.createElement('p')
            bookPages.innerText = `${data.val().pages ? data.val().pages + ' p.' : 'not specified'}`
            
            const readStatus = document.createElement('p')
            readStatus.classList.add('readStatus')
            readStatus.innerText = `${data.val().read ? 'read': 'not read'}`
            readStatus.classList.add(`${data.val().read ? 'read': 'not-read'}`)

            newBook.appendChild(bookDeletebtn)
            newBook.appendChild(bookTitle)
            newBook.appendChild(bookAuthor)
            newBook.appendChild(bookPages)
            newBook.appendChild(readStatus)
            sectionElement.appendChild(newBook)
            
            //attach event listener to the new book
            newBook.addEventListener('click', e => {
                // add class to the read status to enable selecting this element on 'child_changed'
                const statusElement = newBook.getElementsByClassName('readStatus')[0]
                statusElement.id = 'change'
                //get current value
                let currentStatus
                userLibrary.child(newBook.id).once('value', snap => {
                    currentStatus = snap.val().read
                })
                userLibrary.child(newBook.id).update({
                    read: !currentStatus
                })
            })
            
            //attach event listeren to the delete button
            bookDeletebtn.addEventListener('click', e => {
                e.stopPropagation()
                userLibrary.child(newBook.id).remove()
            })

        })
        libraryRef.on('child_changed', data => {
            const changinElement = document.getElementById('change')
            const value = data.val().read ? 'read' : 'not read'
            changinElement.innerText = data.val().read ? 'read':'not read'
            if(changinElement.innerText == 'not read'){
                changinElement.classList.add('not-read')
            } else {
                changinElement.classList.remove('not-read')
            }
            changinElement.removeAttribute('id')
        })
        libraryRef.on('child_removed', data => {
            const bookToRemove = document.getElementById(data.key)
            libraryContainer.removeChild(bookToRemove)
        })
    }
    
    fetchLibrary(userLibrary, libraryContainer)
}

//toggle add book form's visibility
btnPlus.addEventListener('click', e => {
    btnPlus.classList.add('hide')
    addBookContainer.classList.remove('hide')
})
btnCancel.addEventListener('click', e=>{
    addBookContainer.classList.add('hide')
    btnPlus.classList.remove('hide')
})