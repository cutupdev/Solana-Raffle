import { FC } from "react"
import { ScaleLoader } from "react-spinners"

import styles from './loading.module.scss';

const Loading: FC<{loading: boolean}> = ({ loading }) => {
    return (
        <div className={`${styles.overlay} ${!loading && styles.hidden}`}>

        <ScaleLoader color="rgb(213, 211, 194)" />

      </div>
    )
}

export default Loading;