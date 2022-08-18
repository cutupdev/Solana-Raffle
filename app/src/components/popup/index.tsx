import { FC, Dispatch } from "react";
import styles from './popup.module.scss';


type PopupType = {
    children: JSX.Element;
    title: string;
    open: boolean;
    setOpen: Dispatch<React.SetStateAction<boolean>>;
}

const Popup: FC<PopupType> = ({ children, title, open, setOpen }) => {
    return (
        <div className={`${styles.container} ${open && styles.open}`}>
            <div className={styles.underlay} onClick={() => setOpen(false)}/>
            <div className={styles.card}>
                <div className={styles.title}>
                    {title || 'MODAL'} 
                    <div className={styles.close} onClick={() => setOpen(false)}>
                         ✖
                    </div> 
                </div>
                <div className={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default Popup;